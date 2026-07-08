import type { NdjsonLine } from "@/cli/types.js";

export function ndjson(line: NdjsonLine, sink: NodeJS.WritableStream = process.stdout): void {
  sink.write(`${JSON.stringify(line)}\n`);
}

export function result<T>(data: T, sink: NodeJS.WritableStream = process.stdout): void {
  ndjson({ type: "result", ok: true, data }, sink);
}
