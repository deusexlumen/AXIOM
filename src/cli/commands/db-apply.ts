import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { readContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { verifyMigrationHashes } from "@/cli/commands/db-helpers.js";

export async function migrateApply(env: "local" | "prod"): Promise<void> {
  const cwd = process.cwd();
  const context = await readContext(cwd);
  await verifyMigrationHashes(cwd, context);
  if (env === "local") {
    await applyLocal(cwd);
  } else {
    await applyProd(cwd);
  }
  result({ ok: true, env, applied: Object.keys(context.db?.migrationHashes ?? {}).length });
}

async function applyLocal(cwd: string): Promise<void> {
  const dbPath = resolve(cwd, ".axiom/db.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  const client = new PGlite(dbPath);
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: resolve(cwd, "db/migrations") });
}

async function applyProd(cwd: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-D001", "DATABASE_URL is required for prod migrations", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const scriptPath = resolve(cwd, ".axiom", "migrate-prod.mjs");
  const script = `import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
const client = new Client({ connectionString: ${JSON.stringify(url)} });
await client.connect();
const db = drizzle(client);
await migrate(db, { migrationsFolder: ${JSON.stringify(resolve(cwd, "db/migrations"))} });
await client.end();
`;
  await writeFile(scriptPath, script, "utf-8");
  try {
    execFileSync("node", [scriptPath], { cwd, stdio: "ignore" });
  } catch {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-D001", "Prod migration failed; ensure pg driver is installed", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  } finally {
    await rm(scriptPath, { force: true });
  }
}
