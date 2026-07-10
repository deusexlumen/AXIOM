import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { Writable } from "node:stream";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

export function emitLine(sink: NodeJS.WritableStream | undefined, data: unknown): void {
  const out = sink ?? process.stdout;
  out.write(`${JSON.stringify(data)}\n`);
}

export async function readLastPacket(packetFile: string): Promise<FixPacket> {
  const content = await readFile(packetFile, "utf-8");
  const lines = content.trim().split("\n");
  const last = lines[lines.length - 1] ?? content;
  return JSON.parse(last) as FixPacket;
}

export async function writeEscalationReport(
  reportPath: string,
  runId: string,
  packet: FixPacket,
  maxRetries: number
): Promise<void> {
  await mkdir(resolve(reportPath, ".."), { recursive: true });
  const report = { runId, packet, maxRetries, timestamp: new Date().toISOString() };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

export async function waitForAck(cwd: string, packetId: string, intervalMs: number, timeoutMs: number): Promise<void> {
  const ackPath = resolve(cwd, "pipeline", "ack", packetId);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await access(ackPath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  throw new Error(`Ack timeout for packet ${packetId}`);
}
