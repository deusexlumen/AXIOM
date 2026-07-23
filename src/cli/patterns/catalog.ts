import type { PatternCatalogItem, PatternCategory } from "@/cli/schemas/pattern.js";
import { webglPatterns } from "@/cli/patterns/webgl.js";
import { scrollPatterns } from "@/cli/patterns/scroll.js";
import { typoPatterns } from "@/cli/patterns/typo.js";
import { navPatterns } from "@/cli/patterns/nav.js";

const catalog: readonly PatternCatalogItem[] = [
  ...webglPatterns,
  ...scrollPatterns,
  ...typoPatterns,
  ...navPatterns,
];

export function getPattern(name: string): PatternCatalogItem | undefined {
  return catalog.find((p) => p.name === name);
}

export function listPatterns(category?: PatternCategory): PatternCatalogItem[] {
  if (category === undefined) return [...catalog];
  return catalog.filter((p) => p.category === category);
}
