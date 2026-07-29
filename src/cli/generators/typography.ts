import type { DirectionJson } from "@/cli/schemas/direction.js";

export interface FluidTypeOptions {
  basePx: number;
  minViewport: number;
  maxViewport: number;
}

const DEFAULT_OPTIONS: FluidTypeOptions = {
  basePx: 16,
  minViewport: 320,
  maxViewport: 1536,
};

const STEPS: { name: string; level: number }[] = [
  { name: "xs", level: -2 },
  { name: "sm", level: -1 },
  { name: "base", level: 0 },
  { name: "lg", level: 1 },
  { name: "xl", level: 2 },
  { name: "2xl", level: 3 },
  { name: "3xl", level: 4 },
  { name: "display", level: 5 },
];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function fluidTypeTokens(
  scaleRatio: number,
  options: Partial<FluidTypeOptions> = {},
): Record<string, string> {
  const { basePx, minViewport, maxViewport } = { ...DEFAULT_OPTIONS, ...options };
  const out: Record<string, string> = {};
  for (const { name, level } of STEPS) {
    const target = basePx * Math.pow(scaleRatio, level);
    const min = round2(target * 0.9);
    const max = round2(target * 1.25);
    const slope = (max - min) / (maxViewport - minViewport);
    const intercept = round2(min - slope * minViewport);
    const preferred = `${intercept}px + ${round2(slope * 100)}vw`;
    out[`font-size-${name}`] = `clamp(${min}px, ${preferred}, ${max}px)`;
  }
  return out;
}

export function typographyTokensFromDirection(direction: DirectionJson): Record<string, string> {
  return {
    ...fluidTypeTokens(direction.typography.scaleRatio),
    "font-family-display": `"${direction.typography.display.family}", serif`,
    "font-family-text": `"${direction.typography.text.family}", sans-serif`,
  };
}
