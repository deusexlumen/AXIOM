import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AxiomConfig = z.object({
  budgets: z.object({
    maxLocPerFile: z.number().int().positive(),
    maxBytesPerFile: z.number().int().positive(),
    maxRetries: z.number().int().positive(),
  }),
  pipeline: z.object({
    stages: z.array(z.enum(["validate", "contract", "typecheck", "lint", "build", "unit", "e2e", "perf", "critic"])),
    e2eOn: z.enum(["never", "route-change", "always"]).default("route-change"),
  }),
  context: z.object({
    sliceDepth: z.number().int().nonnegative(),
    signatureOnlyBeyondDepth: z.number().int().nonnegative(),
  }),
  ci: z
    .object({
      headlessHeal: z.object({
        enabled: z.boolean().default(false),
      }),
    })
    .default({ headlessHeal: { enabled: false } }),
});

export type AxiomConfig = z.infer<typeof AxiomConfig>;

export const AxiomConfigJsonSchema = zodToJsonSchema(AxiomConfig, { name: "axiom-config" });
