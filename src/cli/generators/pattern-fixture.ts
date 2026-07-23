import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase());
}

function defaultParams(params: PatternCatalogItem["params"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    out[key] = value.default;
  }
  return out;
}

function serialize(value: unknown): string {
  return JSON.stringify(value);
}

export function generateFixture(item: PatternCatalogItem): string {
  const pascal = toPascal(item.name);
  const props = defaultParams(item.params);
  const propEntries = Object.entries(props)
    .map(([key, value]) => `${key}={${serialize(value)}}`)
    .join(" ");

  return `// src/patterns/${item.name}/fixture.tsx — ATELIER MACHINE ZONE
// Fixture page for ${item.name}; default export allowed as generated route wrapper (I-04 exception).
import { ${pascal} } from "@/patterns/${item.name}/index";

export default function ${pascal}Fixture() {
  return (
    <main className="min-h-screen bg-surface-base">
      <${pascal} ${propEntries} />
    </main>
  );
}
`;
}
