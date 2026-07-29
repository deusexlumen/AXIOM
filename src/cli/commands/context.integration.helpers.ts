import { Writable } from "node:stream";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

export function captureStream(): { stream: NodeJS.WritableStream; output: () => string } {
  const chunks: Buffer[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf-8"));
      callback();
    },
  });
  return { stream, output: () => Buffer.concat(chunks).toString("utf-8") };
}

export async function captureStdout<T>(fn: () => Promise<T>): Promise<{ result: T; output: string }> {
  const original = process.stdout.write.bind(process.stdout);
  const chunks: Buffer[] = [];
  process.stdout.write = ((chunk: Buffer | string, ...args: unknown[]) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "utf-8"));
    const callback = args.find((a): a is (error?: Error | null) => void => typeof a === "function");
    if (callback) callback();
    return true;
  }) as typeof process.stdout.write;
  try {
    const result = await fn();
    return { result, output: Buffer.concat(chunks).toString("utf-8") };
  } finally {
    process.stdout.write = original;
  }
}

export function parseLastLine(raw: string): Record<string, unknown> {
  const lines = raw.trim().split("\n");
  const last = lines[lines.length - 1];
  if (!last) throw new Error("Empty command output");
  return JSON.parse(last) as Record<string, unknown>;
}

export function linkComponentChain(dir: string, count: number): void {
  const path = join(dir, "agent-context.json");
  const context = JSON.parse(readFileSync(path, "utf-8")) as AgentContext;
  for (let i = 1; i < count; i++) {
    const current = context.components.find((c) => c.name === `Component_${i}`);
    const prev = context.components.find((c) => c.name === `Component_${i - 1}`);
    if (!current || !prev) throw new Error(`Missing component ${i}`);
    current.dependsOn = [`Component_${i - 1}`];
    prev.usedBy = [`Component_${i}`];
  }
  writeFileSync(path, JSON.stringify(context, null, 2));
}
