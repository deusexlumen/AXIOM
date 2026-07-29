import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function hashFile(path: string): Promise<string> {
  const content = await readFile(path);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function hashBytes(buffer: Buffer): string {
  return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}
