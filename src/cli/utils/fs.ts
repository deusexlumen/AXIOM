import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeTextFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content.replace(/\r\n/g, "\n"), "utf-8");
}

export function writeJsonFile(path: string, value: unknown): Promise<void> {
  const content = `${JSON.stringify(value, Object.keys(value as object).sort(), 2)}\n`;
  return writeTextFile(path, content);
}
