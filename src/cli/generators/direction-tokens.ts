import type { DirectionJson } from "@/cli/schemas/direction.js";
import { fluidTypeTokens } from "@/cli/generators/typography.js";

function spacingTokens(density: number): Record<string, string> {
  const base = Math.round(4 + density * 12);
  return {
    "space-1": `${base / 4}px`,
    "space-2": `${base / 2}px`,
    "space-3": `${base}px`,
    "space-4": `${base * 2}px`,
    "space-5": `${base * 3}px`,
    "space-6": `${base * 4}px`,
    "space-8": `${base * 6}px`,
    "space-10": `${base * 8}px`,
    "space-12": `${base * 12}px`,
  };
}

export function directionTokens(direction: DirectionJson): Record<string, string> {
  const tokens: Record<string, string> = {
    ...fluidTypeTokens(direction.typography.scaleRatio),
    "font-family-display": `"${direction.typography.display.family}", serif`,
    "font-family-text": `"${direction.typography.text.family}", sans-serif`,
    ...spacingTokens(direction.space.density),
  };

  for (const [key, value] of Object.entries(direction.color.tokensDraft)) {
    tokens[`color-${key}`] = value;
  }

  return tokens;
}
