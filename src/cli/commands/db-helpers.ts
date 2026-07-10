import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { hashFile } from "@/cli/manifest/hash.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export async function listMigrationSqlFiles(cwd: string): Promise<string[]> {
  const entries = await readdir(resolve(cwd, "db/migrations"));
  return entries.filter((f) => f.endsWith(".sql")).sort();
}

async function listSchemaFiles(cwd: string): Promise<string[]> {
  try {
    const entries = await readdir(resolve(cwd, "db/schema"));
    return entries
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .sort()
      .map((f) => `db/schema/${f}`);
  } catch {
    return [];
  }
}

export async function recordDbState(cwd: string, context: AgentContext): Promise<string[]> {
  const schemaFiles = await listSchemaFiles(cwd);
  const migrationFiles = await listMigrationSqlFiles(cwd);
  const hashes: Record<string, string> = {};
  for (const file of migrationFiles) {
    hashes[file] = await hashFile(resolve(cwd, "db/migrations", file));
  }
  context.db = context.db ?? { schemaFiles: [], migrationHead: null, migrationHashes: {} };
  context.db.schemaFiles = schemaFiles;
  context.db.migrationHashes = hashes;
  context.db.migrationHead = migrationFiles.length > 0 ? migrationFiles[migrationFiles.length - 1]! : null;
  return migrationFiles;
}

export async function verifyMigrationHashes(cwd: string, context: AgentContext): Promise<void> {
  const files = await listMigrationSqlFiles(cwd);
  const expected = context.db?.migrationHashes ?? {};
  for (const file of files) {
    const actual = await hashFile(resolve(cwd, "db/migrations", file));
    if (expected[file] !== actual) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-D002", `Migration hash mismatch: ${file}`, ["I-10", "I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
  }
}
