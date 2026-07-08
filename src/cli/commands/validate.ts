import { resolve } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { ExitCode } from "@/cli/types.js";
import { result, fail } from "@/cli/utils/ndjson.js";

export async function validate(cwd: string): Promise<void> {
  let context: Awaited<ReturnType<typeof readAgentContext>>;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Invalid agent-context.json: ${message}`, ExitCode.VALIDATION_ERROR);
  }

  const violations = await verifyIntegrity(cwd, context);
  if (violations.length > 0) {
    fail(
      `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`,
      ExitCode.OWNERSHIP_ERROR
    );
  }

  result({ ok: true, violations: [] });
}

export async function validateCommand(args: string[]): Promise<void> {
  const cwd = resolve(process.cwd(), args[0] ?? ".");
  await validate(cwd);
}
