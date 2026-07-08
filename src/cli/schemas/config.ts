import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AxiomConfig = z.object({
  budgets: z.object({
    maxLocPerFile: z.number().int().positive(),
    maxBytesPerFile: z.number().int().positive(),
    maxRetries: z.number().int().positive(),
  }),
  pipeline: z.object({
    stages: z.array(z.enum(["validate", "typecheck", "lint", "unit", "e2e"])),
    e2eOn: z.enum(["route-change", "always", "never"]),
  }),
  context: z.object({
    sliceDepth: z.number().int().nonnegative(),
    signatureOnlyBeyondDepth: z.number().int().nonnegative(),
  }),
});

export type AxiomConfig = z.infer<typeof AxiomConfig>;

export const AxiomConfigJsonSchema = zodToJsonSchema(AxiomConfig, { name: "axiom-config" });
