import { execa } from "execa";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Writable } from "node:stream";
import { createHash } from "node:crypto";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

type Ctx = {
  integrity: { machineFiles: Record<string, string>; lockedFiles: Record<string, string> };
  components: unknown[];
  [key: string]: unknown;
};

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

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

export function writeContext(dir: string, ctx: Ctx): void {
  const copy = JSON.parse(JSON.stringify(ctx)) as Ctx;
  delete copy.integrity.machineFiles["agent-context.json"];
  const hash = `sha256:${createHash("sha256").update(`${JSON.stringify(copy, null, 2)}\n`).digest("hex")}`;
  ctx.integrity.machineFiles["agent-context.json"] = hash;
  writeFileSync(join(dir, "agent-context.json"), `${JSON.stringify(ctx, null, 2)}\n`);
}

export function writeMinimalContext(dir: string, integrity: Ctx["integrity"]): void {
  const tokens = "{}";
  const ctx: Ctx = {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: `sha256:${createHash("sha256").update(tokens).digest("hex")}` },
    integrity,
    pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
  };
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  writeFileSync(join(dir, "tokens.json"), tokens);
  writeContext(dir, ctx);
}

export function installComponent(dir: string, name: string, file: string, content: string): void {
  const ctx = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as Ctx;
  const spec = file.replace(/\.tsx?$/, ".spec.json");
  ctx.components = [
    {
      name,
      file,
      spec,
      test: file.replace(/\.tsx?$/, ".test.tsx"),
      exports: [name],
      dependsOn: [],
      usedBy: [],
      loc: content.split("\n").length,
      bytes: Buffer.byteLength(content),
      status: "STALE",
      specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      lastPipelineRun: "2026-07-08T00:00:00Z",
    },
  ];
  writeFileSync(join(dir, file), content);
  writeFileSync(join(dir, spec), JSON.stringify({ name, description: name, props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] }));
  writeContext(dir, ctx);
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
