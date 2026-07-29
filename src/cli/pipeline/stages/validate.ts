import { validate } from "@/cli/commands/validate.js";
import { CliError } from "@/cli/errors.js";
import type { StageResult } from "@/cli/pipeline/types.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export async function runValidateStage(cwd: string): Promise<StageResult> {
  try {
    await validate(cwd);
    return { ok: true };
  } catch (error) {
    if (error instanceof CliError) {
      return { ok: false, packet: JSON.parse(error.message) as FixPacket };
    }
    throw error;
  }
}
