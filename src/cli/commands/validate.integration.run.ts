import { execa } from "execa";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export async function runValidate(dir: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const result = await execa({ cwd: dir })`node ${process.cwd()}/dist/cli/bin.js validate`;
    return { exitCode: result.exitCode ?? 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const e = error as { exitCode?: number; stdout?: string; stderr?: string };
    return { exitCode: e.exitCode ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

export function parsePacket(stdout: string): { errorCode: string } {
  const last = stdout.trim().split("\n").pop();
  const line = JSON.parse(last!);
  return line.type === "result" && line.ok === false ? line.data : line;
}

export async function runPipeline(dir: string, args: string[] = []): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const result = await execa("node", [`${process.cwd()}/dist/cli/bin.js`, "pipeline", "run", ...args], { cwd: dir });
    return { exitCode: result.exitCode ?? 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const e = error as { exitCode?: number; stdout?: string; stderr?: string };
    return { exitCode: e.exitCode ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

export function parseReport(stdout: string): { ok: boolean; report: { result: "GREEN" | "RED"; failedStage: string | null; packetFile: string | null } } {
  const last = stdout.trim().split("\n").pop();
  const line = JSON.parse(last!);
  return line.data;
}

export function readPacket(dir: string, packetFile: string): FixPacket {
  const content = readFileSync(join(dir, packetFile), "utf-8").trim();
  const last = content.split("\n").pop() ?? content;
  return JSON.parse(last) as FixPacket;
}
