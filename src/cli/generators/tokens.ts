import type { TokensJson, TokenValue } from "@/cli/schemas/tokens.js";

function flatten(prefix: string, value: TokenValue, out: Record<string, string>): void {
  if (typeof value === "string") {
    out[prefix] = value;
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    flatten(`${prefix}-${key}`, child, out);
  }
}

export function themeCss(tokens: TokensJson): string {
  const map: Record<string, string> = {};

  for (const [category, values] of Object.entries(tokens)) {
    for (const [name, value] of Object.entries(values)) {
      flatten(`${category}-${name}`, value, map);
    }
  }

  const keys = Object.keys(map).sort();
  const rootLines = keys.map((key) => `  --${key}: ${map[key]};`);
  const themeLines = keys.map((key) => `  --${key}: var(--${key});`);

  return `:root {\n${rootLines.join("\n")}\n}\n\n@theme inline {\n${themeLines.join("\n")}\n}\n`;
}
