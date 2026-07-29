import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const Lease = z.object({
  leaseId: z.string(),
  agentId: z.string(),
  orderId: z.string(),
  scope: z.array(z.string()),
  acquiredAt: z.string().datetime(),
  ttlSeconds: z.number().int().positive(),
  heartbeatAt: z.string().datetime(),
});

export type Lease = z.infer<typeof Lease>;

export const LeaseStore = z.object({
  leases: z.array(Lease),
});

export type LeaseStore = z.infer<typeof LeaseStore>;

export const LeaseJsonSchema = zodToJsonSchema(LeaseStore, { name: "leases" });
