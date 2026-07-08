import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const Status = z.enum(["GREEN", "RED", "STALE", "ORPHAN"]);

export const ComponentEntry = z.object({
  name: z.string(),
  file: z.string(),
  spec: z.string(),
  test: z.string(),
  exports: z.array(z.string()),
  dependsOn: z.array(z.string()).default([]),
  usedBy: z.array(z.string()).default([]),
  loc: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
  status: Status,
  specHash: z.string(),
  lastPipelineRun: z.string().datetime().optional(),
});

export const RouteEntry = z.object({
  path: z.string(),
  component: z.string(),
  file: z.string(),
});

export const StoreEntry = z.object({
  name: z.string(),
  file: z.string(),
  shapeHash: z.string(),
});

export const AgentContext = z.object({
  axiomVersion: z.string(),
  project: z.object({
    name: z.string(),
    tokenBudget: z.object({ hardLimitPerSlice: z.number().int().positive(), warnAt: z.number().int().positive() }),
  }),
  components: z.array(ComponentEntry).default([]),
  routes: z.array(RouteEntry).default([]),
  stores: z.array(StoreEntry).default([]),
  tokens: z.object({ file: z.string(), hash: z.string() }),
  integrity: z.object({
    lockedFiles: z.record(z.string(), z.string()),
    machineFiles: z.record(z.string(), z.string()),
  }),
  pipeline: z.object({
    lastRun: z
      .object({ id: z.string(), result: Status, failedStage: z.string().nullable() })
      .nullable()
      .default(null),
  }),
});

export type AgentContext = z.infer<typeof AgentContext>;

export const AgentContextJsonSchema = zodToJsonSchema(AgentContext, { name: "agent-context" });
