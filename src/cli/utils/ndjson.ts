import { ExitCode, type NdjsonLine } from "@/cli/types.js";

export function ndjson(line: NdjsonLine, sink: NodeJS.WritableStream = process.stdout): void {
  sink.write(`${JSON.stringify(line)}\n`);
}

export function result<T>(data: T, sink: NodeJS.WritableStream = process.stdout): void {
  ndjson({ type: "result", ok: true, data }, sink);
}

export function fail(message: string, code: ExitCode): never {
  ndjson({ type: "result", ok: false, data: { message } });
  process.exit(code);
}
