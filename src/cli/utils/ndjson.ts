import type { NdjsonLine } from "@/cli/types.js";

export function ndjson(line: NdjsonLine): void {
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export function result<T>(data: T): void {
  ndjson({ type: "result", ok: true, data });
}

export function fail(message: string, code: number): never {
  ndjson({ type: "result", ok: false, data: { message } });
  process.exit(code);
}
