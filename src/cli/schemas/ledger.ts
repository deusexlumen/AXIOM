import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const LedgerRule = z.discriminatedUnion("type", [
  z.object({ type: z.literal("forbidden-dependency"), match: z.array(z.string()) }),
  z.object({ type: z.literal("forbidden-import-path"), match: z.array(z.string()) }),
  z.object({ type: z.literal("required-token-usage"), match: z.array(z.string()) }),
  z.object({ type: z.literal("forbidden-api-pattern"), match: z.array(z.string()) }),
]);

export const LedgerEntry = z.object({
  id: z.string(),
  date: z.string().datetime(),
  scope: z.string(),
  decision: z.string(),
  rationale: z.string(),
  class: z.enum(["advisory", "enforced"]),
  rule: LedgerRule.nullable(),
  supersedes: z.string().nullable(),
});

export type LedgerRule = z.infer<typeof LedgerRule>;
export type LedgerEntry = z.infer<typeof LedgerEntry>;
export const LedgerJsonSchema = zodToJsonSchema(LedgerEntry, { name: "ledger-entry" });
