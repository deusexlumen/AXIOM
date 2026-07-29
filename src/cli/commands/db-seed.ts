import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { loadSchemaTables } from "@/cli/commands/db-schema-loader.js";

export async function seed(fixturePath: string): Promise<void> {
  const cwd = process.cwd();
  const context = await readContext(cwd);
  const raw = await readFile(resolve(cwd, fixturePath), "utf-8");
  const fixture = JSON.parse(raw) as Record<string, unknown>;
  const tables = await loadSchemaTables(cwd, context.db?.schemaFiles ?? []);
  const dbPath = resolve(cwd, ".axiom/db.sqlite");
  mkdirSync(dirname(dbPath), { recursive: true });
  const client = new PGlite(dbPath);
  const db = drizzle(client);
  const names = Object.keys(fixture).sort();
  for (const name of names) {
    const table = tables[name];
    if (!table) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-D003", `Unknown table in fixture: ${name}`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    const rows = fixture[name];
    if (!Array.isArray(rows)) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-D003", `Rows for ${name} must be an array`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    if (rows.length > 0) await db.insert(table).values(rows as Record<string, unknown>[]);
  }
  result({ ok: true, seeded: names });
}
