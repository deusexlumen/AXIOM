import type { PatternCatalogItem, PatternJson } from "@/cli/schemas/pattern.js";
import { generateWebglPattern } from "@/cli/generators/pattern-webgl.js";
import { generateScrollPattern } from "@/cli/generators/pattern-scroll.js";
import { generateTypoPattern } from "@/cli/generators/pattern-typo.js";
import { generateNavPattern } from "@/cli/generators/pattern-nav.js";
import { generateFixture } from "@/cli/generators/pattern-fixture.js";

export interface GeneratedPattern {
  patternJson: string;
  indexTsx: string;
  fixtureTsx: string;
  shaderGlsl?: string;
}

function applyParams(item: PatternCatalogItem, overrideJson?: string): PatternJson {
  const override: Record<string, unknown> = overrideJson !== undefined ? (JSON.parse(overrideJson) as Record<string, unknown>) : {};
  const mergedParams: PatternJson["params"] = {};
  for (const [key, param] of Object.entries(item.params)) {
    mergedParams[key] = {
      ...param,
      default: override[key] !== undefined ? override[key] : param.default,
    };
  }
  return {
    name: item.name,
    category: item.category,
    params: mergedParams,
    budgets: item.budgets,
    a11y: item.a11y,
    dependencies: item.dependencies,
    motionTokens: item.motionTokens,
  };
}

function generateIndex(item: PatternCatalogItem): { indexTsx: string; shaderGlsl?: string } {
  if (item.category === "webgl") return generateWebglPattern(item);
  if (item.category === "scroll") return generateScrollPattern(item);
  if (item.category === "typo") return generateTypoPattern(item);
  if (item.category === "nav") return generateNavPattern(item);
  return { indexTsx: placeholderIndex(item) };
}

function placeholderIndex(item: PatternCatalogItem): string {
  const pascal = item.name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
  return `"use client";
export function ${pascal}() {
  return <div data-axm-id="${item.name}">{/* Pattern stub */}</div>;
}
`;
}

export function generatePatternFiles(item: PatternCatalogItem, params?: string): GeneratedPattern {
  const patternJson = applyParams(item, params);
  const { indexTsx, shaderGlsl } = generateIndex(item);
  return {
    patternJson: `${JSON.stringify(patternJson, null, 2)}\n`,
    indexTsx,
    fixtureTsx: generateFixture(item),
    shaderGlsl,
  };
}
