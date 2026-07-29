import { z } from "zod/v3";

export const PatternCategory = z.enum(["webgl", "scroll", "typo", "nav"]);
export type PatternCategory = z.infer<typeof PatternCategory>;

export const PatternParamType = z.enum(["string", "number", "boolean", "array", "object"]);
export type PatternParamType = z.infer<typeof PatternParamType>;

export const PatternParam = z.object({
  type: PatternParamType,
  default: z.unknown().optional(),
  description: z.string(),
});
export type PatternParam = z.infer<typeof PatternParam>;

export const PatternBudgets = z.object({
  maxDrawcalls: z.number().optional(),
  maxTextureMB: z.number().optional(),
  targetGPUFrameMs: z.number().optional(),
  maxLongTasks: z.number().optional(),
});
export type PatternBudgets = z.infer<typeof PatternBudgets>;

export const PatternA11y = z.object({
  reducedMotion: z.enum(["opacity-only", "instant", "none"]),
});
export type PatternA11y = z.infer<typeof PatternA11y>;

export const PatternJson = z.object({
  name: z.string(),
  category: PatternCategory,
  params: z.record(z.string(), PatternParam),
  budgets: PatternBudgets,
  a11y: PatternA11y,
  dependencies: z.array(z.string()),
  motionTokens: z.array(z.string()),
});
export type PatternJson = z.infer<typeof PatternJson>;

export const PatternCatalogItem = PatternJson.extend({
  wave: z.union([z.literal(1), z.literal(2)]),
});
export type PatternCatalogItem = z.infer<typeof PatternCatalogItem>;
