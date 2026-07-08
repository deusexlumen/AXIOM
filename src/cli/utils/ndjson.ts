import { ExitCode, type NdjsonLine } from "@/cli/types.js";

export function ndjson(line: NdjsonLine): void {
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

export function result<T>(data: T): void {
  ndjson({ type: "result", ok: true, data });
}

export function fail(message: string, code: ExitCode): never {
  ndjson({ type: "result", ok: false, data: { message } });
  process.exit(code);
}
