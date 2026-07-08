import { resolve } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

function buildFixPacket(errorCode: string, message: string, targetFile: string): FixPacket {
  return {
    packetId: `m1_${errorCode.toLowerCase()}`,
    runId: "m1_validate",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity: "BLOCKING",
    target: { file: targetFile },
    message,
    rawEvidence: {},
    probableCause: errorCode === "AXM-V011" ? "File changed after manifest was written" : "agent-context.json does not match schema",
    fixHint: errorCode === "AXM-V011" ? "Re-run axm init or restore the original file" : "Fix agent-context.json to match the schema",
    invariantsAffected: errorCode === "AXM-V011" ? ["I-10"] : ["I-11"],
    agentInstruction: "Correct the issue and re-run axm validate",
  };
}

export async function validate(cwd: string): Promise<void> {
  let context: Awaited<ReturnType<typeof readAgentContext>>;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-V000", `Invalid agent-context.json: ${message}`, "agent-context.json")),
      ExitCode.VALIDATION_ERROR
    );
  }

  const violations = await verifyIntegrity(cwd, context);
  if (context.tokens.file) {
    const actual = await hashFile(resolve(cwd, context.tokens.file));
    if (actual !== context.tokens.hash) {
      violations.push({ file: context.tokens.file, expected: context.tokens.hash, actual });
    }
  }

  if (violations.length > 0) {
    const file = violations[0]!.file;
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-V011", `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`, file)),
      ExitCode.OWNERSHIP_ERROR
    );
  }

  result({ ok: true, violations: [] });
}

export async function validateCommand(args: string[]): Promise<void> {
  const cwd = resolve(process.cwd(), args[0] ?? ".");
  await validate(cwd);
}
