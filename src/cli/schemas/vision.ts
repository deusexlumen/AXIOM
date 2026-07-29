import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const FieldType = z.string();

export const VisionEntity = z.object({
  name: z.string(),
  fields: z.record(z.string(), FieldType),
});

export const VisionRoute = z.object({
  path: z.string(),
  purpose: z.string(),
});

export const VisionConstraint = z.string();
export const VisionPriority = z.string();

export const VisionVetoGate = z.enum(["post-plan", "pre-deploy"]);

export const VisionBudgets = z.object({
  maxComponents: z.number().int().nonnegative(),
  maxEndpoints: z.number().int().nonnegative(),
  tokenCeilingTotal: z.number().int().nonnegative(),
});

export const Vision = z.object({
  $schema: z.string().optional(),
  visionId: z.string(),
  goal: z.string(),
  entities: z.array(VisionEntity),
  routes: z.array(VisionRoute),
  constraints: z.array(VisionConstraint),
  priorities: z.array(VisionPriority),
  vetoGates: z.array(VisionVetoGate),
  budgets: VisionBudgets,
});

export type FieldType = z.infer<typeof FieldType>;
export type VisionEntity = z.infer<typeof VisionEntity>;
export type VisionRoute = z.infer<typeof VisionRoute>;
export type VisionConstraint = z.infer<typeof VisionConstraint>;
export type VisionPriority = z.infer<typeof VisionPriority>;
export type VisionVetoGate = z.infer<typeof VisionVetoGate>;
export type VisionBudgets = z.infer<typeof VisionBudgets>;
export type Vision = z.infer<typeof Vision>;

export const VisionJsonSchema = zodToJsonSchema(Vision, { name: "vision" });
