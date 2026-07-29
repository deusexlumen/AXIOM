import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import { buildFixPacket } from "@/cli/validate/packet.js";
import { ExitCode } from "@/cli/types.js";

export interface DirectAmendOptions {
  cwd: string;
  reason: string;
  out?: NodeJS.WritableStream;
}

export async function directAmend({ cwd, reason, out }: DirectAmendOptions): Promise<void> {
  if (!reason || reason.trim().length === 0) {
    throw new CliError(
      JSON.stringify(
        buildFixPacket(
          "AXM-V000",
          "amend requires --reason <text>",
          "DIRECTION.axm.json",
          ["I-20"],
          "Provide --reason with a concise rationale for the direction change.",
          "Missing required --reason argument."
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const targetPath = resolve(cwd, "DIRECTION.axm.json");
  const context = await readContext(cwd);
  if (!context.direction) {
    throw new CliError(
      JSON.stringify(
        buildFixPacket(
          "AXM-R002",
          "DIRECTION is not frozen; use atl direct choose first",
          "DIRECTION.axm.json",
          ["I-20"],
          "Run 'atl direct generate' and 'atl direct choose <id>' before amending.",
          "Attempted amend before direction was frozen."
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const currentHash = await hashFile(targetPath);
  context.direction.hash = currentHash;
  context.direction.frozenAt = new Date().toISOString();
  context.integrity.machineFiles["DIRECTION.axm.json"] = currentHash;
  await writeContext(cwd, context);

  result({ ok: true, directionId: context.direction.file, amended: true, reason }, out);
}
