import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";
import { pageMaskTransition, webglCrossfade } from "@/cli/generators/pattern-nav-transition.js";
import { magneticCta } from "@/cli/generators/pattern-nav-magnetic.js";
import { cursorSystem } from "@/cli/generators/pattern-nav-cursor.js";
import { preloaderCounter } from "@/cli/generators/pattern-nav-preloader.js";

export function generateNavPattern(item: PatternCatalogItem): { indexTsx: string; shaderGlsl?: string } {
  if (item.name === "page-mask-transition") return pageMaskTransition(item);
  if (item.name === "webgl-crossfade") return webglCrossfade(item);
  if (item.name === "magnetic-cta") return magneticCta(item);
  if (item.name === "cursor-system") return cursorSystem(item);
  if (item.name === "preloader-counter") return preloaderCounter(item);
  const pascal = item.name.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
  return {
    indexTsx: `"use client";
export function ${pascal}() {
  return <div data-axm-id="${item.name}">{/* Pattern stub */}</div>;
}
`,
  };
}
