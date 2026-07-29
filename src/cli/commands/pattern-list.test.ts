import { describe, it, expect } from "vitest";
import { listPatternCommand } from "@/cli/commands/pattern-list.js";

function collectOutput(fn: () => void): string[] {
  const lines: string[] = [];
  const sink = { write: (chunk: string) => { lines.push(chunk); } } as unknown as NodeJS.WritableStream;
  fn.call({ out: sink });
  return lines;
}

describe("listPatternCommand", () => {
  it("returns all wave-1 and wave-2 patterns", () => {
    const lines: string[] = [];
    const sink = { write: (chunk: string) => { lines.push(chunk); } } as unknown as NodeJS.WritableStream;
    listPatternCommand({ out: sink });

    const parsed = JSON.parse(lines.join(""));
    expect(parsed.ok).toBe(true);
    const result = parsed.data as { ok: boolean; patterns: { name: string; category: string }[] };
    expect(result.ok).toBe(true);
    expect(result.patterns).toHaveLength(18);
    expect(result.patterns.some((p) => p.name === "distortion-media")).toBe(true);
    expect(result.patterns.some((p) => p.name === "preloader-counter")).toBe(true);
  });

  it("filters patterns by category", () => {
    const lines: string[] = [];
    const sink = { write: (chunk: string) => { lines.push(chunk); } } as unknown as NodeJS.WritableStream;
    listPatternCommand({ category: "webgl", out: sink });

    const parsed = JSON.parse(lines.join(""));
    expect(parsed.ok).toBe(true);
    const result = parsed.data as { ok: boolean; patterns: { name: string; category: string }[] };
    expect(result.ok).toBe(true);
    expect(result.patterns.every((p) => p.category === "webgl")).toBe(true);
  });
});
