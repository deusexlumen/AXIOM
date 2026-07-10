import { z } from "zod/v3";

export const MigrationHash = z.object({
  file: z.string(),
  hash: z.string(),
});

export type MigrationHash = z.infer<typeof MigrationHash>;

export const DbContext = z.object({
  schemaFiles: z.array(z.string()).default([]),
  migrationHead: z.string().nullable().default(null),
  migrationHashes: z.record(z.string(), z.string()).default({}),
});

export type DbContext = z.infer<typeof DbContext>;
