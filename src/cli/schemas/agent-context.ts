import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";
import { DbContext } from "@/cli/schemas/db.js";

export const Status = z.enum(["GREEN", "RED", "STALE", "ORPHAN"]);

export const VisionStatus = z.enum(["PLANNED", "APPROVED", "REJECTED"]);

export type VisionStatus = z.infer<typeof VisionStatus>;

export const VisionSummary = z.object({
  visionId: z.string(),
  status: VisionStatus,
});

export type VisionSummary = z.infer<typeof VisionSummary>;

export const HttpMethod = z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]);

export const EndpointEntry = z.object({
  name: z.string(),
  method: HttpMethod,
  path: z.string(),
  contract: z.string(),
  handler: z.string(),
  clientMethod: z.string(),
  status: Status,
});

export type EndpointEntry = z.infer<typeof EndpointEntry>;

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

export type RouteEntry = z.infer<typeof RouteEntry>;

export const StoreEntry = z.object({
  name: z.string(),
  file: z.string(),
  shapeHash: z.string(),
});

export const OrderCounts = z.object({
  open: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
});

export const AgentLease = z.object({
  agentId: z.string(),
  role: z.string(),
  activeLease: z.string().nullable(),
  lastHeartbeat: z.string().datetime(),
});

export const LedgerSummary = z.object({
  entries: z.number().int().nonnegative(),
  lastId: z.string(),
  hash: z.string(),
});

export const BenchMetrics = z.object({
  lastRun: z.string().datetime().nullable(),
  greenRateAt1: z.number().min(0).max(1),
  medianTokensToGreen: z.number().int().nonnegative(),
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
  endpoints: z.array(EndpointEntry).optional(),
  db: DbContext.optional(),
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
  orders: OrderCounts.optional(),
  visions: z.array(VisionSummary).optional(),
  agents: z.array(AgentLease).optional(),
  ledger: LedgerSummary.optional(),
  bench: BenchMetrics.optional(),
});

export type AgentContext = z.infer<typeof AgentContext>;

export const AgentContextJsonSchema = zodToJsonSchema(AgentContext, { name: "agent-context" });
