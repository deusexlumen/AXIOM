import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { result } from "@/cli/utils/ndjson.js";
import { readContext } from "@/cli/manifest/mutate.js";
import { runAudit } from "@/cli/security/audit.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { ExitCode } from "@/cli/types.js";
import { CliError } from "@/cli/errors.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";

function throwValidationError(message: string): never {
  throw new CliError(
    JSON.stringify(buildSecurityPacket("AXM-V000", "package.json", message, {}, "CLI input does not satisfy the command contract.", "Check the command usage and required arguments.")),
    ExitCode.VALIDATION_ERROR
  );
}

export async function auditCommand(): Promise<void> {
  const cwd = process.cwd();
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(await readFile(resolve(cwd, "package.json"), "utf-8")) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throwValidationError(`Invalid package.json: ${message}`);
  }

  const lockfileHash = await hashFile(resolve(cwd, "pnpm-lock.yaml")).catch(() => "");

  let manifestHash: string | null;
  try {
    const context = await readContext(cwd);
    manifestHash = context.integrity.machineFiles["pnpm-lock.yaml"] ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(
      JSON.stringify(
        buildSecurityPacket(
          "AXM-V000",
          "agent-context.json",
          `Invalid agent-context.json: ${message}`,
          {},
          "agent-context.json does not match schema",
          "Fix agent-context.json to match the schema"
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const packets = await runAudit({ cwd, packageJson: pkg, lockfileHash, manifestHash });
  if (packets.length > 0) {
    throw new CliError(JSON.stringify(packets[0]), ExitCode.SECURITY_ERROR);
  }
  result({ ok: true, violations: [] });
}
