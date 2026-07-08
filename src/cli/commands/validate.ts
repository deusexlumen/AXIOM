import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const MAX_BYTES = 4096;

function buildFixPacket(
  errorCode: string,
  message: string,
  targetFile: string,
  invariants: string[],
  fixHint: string,
  probableCause: string
): FixPacket {
  return {
    packetId: `m2_${errorCode.toLowerCase()}`,
    runId: "m2_validate",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity: "BLOCKING",
    target: { file: targetFile },
    message,
    rawEvidence: {},
    probableCause,
    fixHint,
    invariantsAffected: invariants,
    agentInstruction: `Correct ${targetFile} and re-run axm validate`,
  };
}

async function checkByteCap(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath);
    if (content.length > MAX_BYTES) {
      return buildFixPacket(
        "AXM-V002",
        `File ${component.file} exceeds ${MAX_BYTES} bytes (${content.length}).`,
        component.file,
        ["I-02"],
        "Split the file using 'axm split' or reduce its size.",
        "Component file grew beyond the hard byte budget."
      );
    }
  }
  return null;
}

async function checkSingleExport(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath, "utf-8");
    const exportMatches = content.match(/^export\s+/gmu);
    const count = exportMatches?.length ?? 0;
    if (count !== 1) {
      return buildFixPacket(
        "AXM-V003",
        `File ${component.file} has ${count} exports; exactly 1 named export is required.`,
        component.file,
        ["I-03"],
        "Extract additional exports into separate files via 'axm split'.",
        "Component file exports more or fewer than one symbol."
      );
    }
  }
  return null;
}

async function checkSidecar(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    try {
      await readFile(resolve(cwd, component.spec), "utf-8");
    } catch {
      return buildFixPacket(
        "AXM-V007",
        `Missing sidecar ${component.spec} for component ${component.name}.`,
        component.file,
        ["I-07"],
        `Create ${component.spec} or re-run 'axm add component ${component.name}'.`,
        "Component listed in agent-context.json but sidecar file is missing."
      );
    }
  }
  return null;
}

export async function validate(cwd: string, out?: NodeJS.WritableStream): Promise<void> {
  let context: AgentContext;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(
      JSON.stringify(
        buildFixPacket(
          "AXM-V000",
          `Invalid agent-context.json: ${message}`,
          "agent-context.json",
          ["I-11"],
          "Fix agent-context.json to match the schema",
          "agent-context.json does not match schema"
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const checks = [
    () => checkByteCap(cwd, context),
    () => checkSingleExport(cwd, context),
    () => checkSidecar(cwd, context),
    async () => {
      const violations = await verifyIntegrity(cwd, context);
      if (context.tokens.file) {
        const actual = await hashFile(resolve(cwd, context.tokens.file));
        if (actual !== context.tokens.hash) {
          violations.push({ file: context.tokens.file, expected: context.tokens.hash, actual });
        }
      }
      if (violations.length > 0) {
        const file = violations[0]!.file;
        return buildFixPacket(
          "AXM-V011",
          `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`,
          file,
          ["I-10"],
          "Re-run 'axm init' or restore the original file.",
          "File changed after manifest was written."
        );
      }
      return null;
    },
  ];

  for (const check of checks) {
    const packet = await check();
    if (packet !== null) {
      const exitCode = packet.errorCode === "AXM-V011" ? ExitCode.OWNERSHIP_ERROR : ExitCode.VALIDATION_ERROR;
      throw new CliError(JSON.stringify(packet), exitCode);
    }
  }

  result({ ok: true, violations: [] }, out);
}

export async function validateCommand(args: string[]): Promise<void> {
  const cwd = resolve(process.cwd(), args[0] ?? ".");
  await validate(cwd);
}
