import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const OrderScope = z.object({
  writeAllowed: z.array(z.string()),
  readContext: z.string().optional(),
});

export const OrderProduces = z.object({
  components: z.array(z.string()).optional(),
  endpoints: z.array(z.string()).optional(),
  routes: z.array(z.string()).optional(),
});

export const OrderAcceptance = z.object({
  pipelineScope: z.string().optional(),
  gherkin: z.array(z.string()),
});

export const OrderAttempts = z.object({
  current: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
});

export const WorkOrderStatus = z.enum([
  "OPEN",
  "CLAIMED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BLOCKED",
]);

export const WorkOrder = z.object({
  $schema: z.string().optional(),
  orderId: z.string(),
  visionId: z.string(),
  goal: z.string(),
  scope: OrderScope,
  dependsOn: z.array(z.string()).default([]),
  produces: OrderProduces,
  acceptance: OrderAcceptance,
  tokenBudget: z.number().int().nonnegative(),
  leaseRequired: z.boolean(),
  status: WorkOrderStatus,
  claimedBy: z.string().nullable(),
  attempts: OrderAttempts,
  agentInstruction: z.string(),
});

export type OrderScope = z.infer<typeof OrderScope>;
export type OrderProduces = z.infer<typeof OrderProduces>;
export type OrderAcceptance = z.infer<typeof OrderAcceptance>;
export type OrderAttempts = z.infer<typeof OrderAttempts>;
export type WorkOrderStatus = z.infer<typeof WorkOrderStatus>;
export type WorkOrder = z.infer<typeof WorkOrder>;

export const WorkOrderJsonSchema = zodToJsonSchema(WorkOrder, { name: "work-order" });
