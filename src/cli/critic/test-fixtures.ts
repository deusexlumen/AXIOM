import { writeFileSync } from "node:fs";
import { Writable } from "node:stream";

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

export function captureStream(): { stream: NodeJS.WritableStream; lines: unknown[] } {
  const lines: unknown[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim() !== "") lines.push(JSON.parse(line));
      }
      callback();
    },
  });
  return { stream, lines };
}

export function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}
