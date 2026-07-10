import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const FixPacket = z.object({
  packetId: z.string(),
  runId: z.string(),
  attempt: z.object({ current: z.number().int().nonnegative(), max: z.number().int().positive() }),
  errorCode: z.string(),
  stage: z.enum(["validate", "contract", "typecheck", "lint", "unit", "e2e", "generate"]),
  severity: z.enum(["BLOCKING", "WARNING"]),
  target: z.object({
    component: z.string().optional(),
    file: z.string(),
    line: z.number().int().positive().optional(),
    column: z.number().int().positive().optional(),
  }),
  message: z.string(),
  rawEvidence: z.record(z.string(), z.unknown()).default({}),
  probableCause: z.string(),
  fixHint: z.string(),
  lastAttemptDiff: z.string().optional(),
  contextSlice: z.object({ command: z.string(), estimatedTokens: z.number().int().nonnegative() }).optional(),
  orderId: z.string().optional(),
  ledgerRefs: z.array(z.string()).optional(),
  invariantsAffected: z.array(z.string()).default([]),
  agentInstruction: z.string(),
});

export type FixPacket = z.infer<typeof FixPacket>;

export const FixPacketJsonSchema = zodToJsonSchema(FixPacket, { name: "fix-packet" });
