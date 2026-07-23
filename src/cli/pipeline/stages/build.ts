import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execa } from "execa";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runBuildStage(cwd: string): Promise<StageResult> {
  try {
    await execa("pnpm", ["build"], { cwd, stdio: "pipe" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-B001", message, "package.json", 1, 1, "build", ["I-09"]),
    };
  }
  if (!existsSync(resolve(cwd, "out"))) {
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-B002", "Build completed but output directory 'out/' is missing", "package.json", 1, 1, "build", []),
    };
  }
  return { ok: true };
}
