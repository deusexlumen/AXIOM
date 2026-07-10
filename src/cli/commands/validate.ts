import { resolve } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import { buildFixPacket } from "@/cli/validate/packet.js";
import {
  checkLocLimit,
  checkByteCap,
  checkDefaultExport,
  checkSingleExport,
  checkBarrelFile,
  checkRelativeImport,
  checkSidecar,
  checkRawValues,
  checkEscapeHatches,
  checkDynamicImports,
  checkOwnership,
  checkIntegrity,
} from "@/cli/validate/checks.js";
import { runEslintChecks } from "@/cli/validate/lint.js";
import { checkLedger } from "@/cli/validate/ledger.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const OWNERSHIP_CODES = new Set(["AXM-V010", "AXM-V011"]);
const LEDGER_CODES = new Set(["AXM-Q001"]);

function throwContextError(error: unknown): never {
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

export async function validate(
  cwd: string,
  out?: NodeJS.WritableStream,
  options?: { ledger?: boolean }
): Promise<void> {
  let context: AgentContext;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    throwContextError(error);
  }

  const files = context.components.map((component) => component.file);
  const checks = [
    () => checkLocLimit(cwd, context),
    () => checkByteCap(cwd, context),
    () => checkDefaultExport(cwd, context),
    () => checkSingleExport(cwd, context),
    () => checkBarrelFile(cwd, context),
    () => checkRelativeImport(cwd, context),
    () => checkSidecar(cwd, context),
    () => checkRawValues(cwd, context),
    () => checkEscapeHatches(cwd, context),
    () => checkDynamicImports(cwd, context),
    () => Promise.resolve(checkOwnership(cwd, context)),
    () => checkIntegrity(cwd, context),
    () => runEslintChecks(cwd, files),
    ...(options?.ledger ? [() => checkLedger(cwd, context)] : []),
  ];

  for (const check of checks) {
    const packet = await check();
    if (packet !== null) {
      let exitCode = ExitCode.VALIDATION_ERROR;
      if (OWNERSHIP_CODES.has(packet.errorCode)) exitCode = ExitCode.OWNERSHIP_ERROR;
      if (LEDGER_CODES.has(packet.errorCode)) exitCode = ExitCode.LEDGER_ERROR;
      throw new CliError(JSON.stringify(packet), exitCode);
    }
  }

  result({ ok: true, violations: [] }, out);
}

export async function validateCommand(args: string[]): Promise<void> {
  const ledger = args.includes("--ledger");
  const positional = args.filter((a) => a !== "--ledger");
  const cwdArg = positional[0]?.startsWith("--") ? "." : (positional[0] ?? ".");
  const cwd = resolve(process.cwd(), cwdArg);
  await validate(cwd, undefined, { ledger });
}
