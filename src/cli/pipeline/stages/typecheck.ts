import { execSync } from "node:child_process";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runTypecheckStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm tsc --noEmit --pretty false", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stderr = String((error as { stderr?: Buffer }).stderr ?? "");
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "");
    const output = stderr || stdout;
    const first = output.split("\n").find((line) => line.includes("error TS")) ?? output.split("\n")[0] ?? "TypeScript error";
    const match = first.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);
    const file = match?.[1]?.trim() ?? "src/components/Unknown.tsx";
    const line = Number(match?.[2] ?? 1);
    const column = Number(match?.[3] ?? 1);
    const tsCode = match?.[4] ?? "TS0000";
    const message = match?.[5] ?? first;
    return {
      ok: false,
      packet: buildPipelinePacket("AXM-T001", message, file, line, column, "typecheck", ["I-09"], { tsCode }),
    };
  }
}
