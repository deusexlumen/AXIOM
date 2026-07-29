import { execa } from "execa";
import { join } from "node:path";
import { parseLastLine } from "@/cli/commands/context.integration.helpers.js";

const binPath = join(process.cwd(), "dist", "cli", "bin.js");

type ResultLine = { type?: string; ok?: boolean; data: Record<string, unknown> };
export type Packet = { errorCode: string; ledgerRefs?: string[] };

export async function runAxm(
  dir: string,
  args: string[],
  env?: NodeJS.ProcessEnv
): Promise<{ exitCode: number; stdout: string }> {
  const result = await execa("node", [binPath, ...args], { cwd: dir, reject: false, env });
  return { exitCode: result.exitCode ?? 0, stdout: result.stdout };
}

export function parseResult(stdout: string): Record<string, unknown> {
  const line = parseLastLine(stdout) as ResultLine;
  return line.type === "result" && line.ok === true ? line.data : line;
}

export function parsePacket(stdout: string): Packet {
  const line = parseLastLine(stdout) as ResultLine;
  return (line.type === "result" && line.ok === false ? line.data : line) as Packet;
}
