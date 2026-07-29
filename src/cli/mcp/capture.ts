import type { NdjsonLine } from "@/cli/types.js";

export interface CaptureResult {
  exitCode: number;
  lines: NdjsonLine[];
}

function chunkToString(chunk: string | Buffer | Uint8Array, encoding?: BufferEncoding): string {
  if (typeof chunk === "string") return chunk;
  if (Buffer.isBuffer(chunk)) return chunk.toString(encoding ?? "utf-8");
  return Buffer.from(chunk).toString("utf-8");
}

export async function captureStdout(handler: () => Promise<number>): Promise<CaptureResult> {
  const originalWrite = process.stdout.write.bind(process.stdout);
  const chunks: string[] = [];
  process.stdout.write = ((
    chunk: string | Buffer | Uint8Array,
    encoding?: BufferEncoding,
    callback?: (error?: Error | null) => void,
  ): boolean => {
    chunks.push(chunkToString(chunk, encoding));
    if (callback) callback();
    return true;
  }) as typeof process.stdout.write;

  try {
    const exitCode = await handler();
    const lines = chunks
      .join("")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .reduce<NdjsonLine[]>((acc, line) => {
        try {
          acc.push(JSON.parse(line) as NdjsonLine);
        } catch {
          // skip non-NDJSON lines
        }
        return acc;
      }, []);
    return { exitCode, lines };
  } finally {
    process.stdout.write = originalWrite;
  }
}
