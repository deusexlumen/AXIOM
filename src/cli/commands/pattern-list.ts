import { listPatterns } from "@/cli/patterns/catalog.js";
import { result } from "@/cli/utils/ndjson.js";
import type { PatternCategory } from "@/cli/schemas/pattern.js";

export interface ListPatternOptions {
  category?: PatternCategory;
  out?: NodeJS.WritableStream;
}

export function listPatternCommand(options: ListPatternOptions = {}): void {
  const patterns = listPatterns(options.category).map((p) => ({
    name: p.name,
    category: p.category,
    wave: p.wave,
  }));
  result({ ok: true, patterns }, options.out);
}
