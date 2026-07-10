import { register } from "tsx/esm/api";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { getTableName } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";

export interface TableMap {
  [name: string]: PgTable;
}

function isPgTable(value: unknown): value is PgTable {
  return typeof value === "object" && value !== null && typeof getTableName(value as PgTable) === "string";
}

export async function loadSchemaTables(cwd: string, schemaFiles: string[]): Promise<TableMap> {
  const unregister = register();
  try {
    const tables: TableMap = {};
    for (const file of schemaFiles) {
      const mod = (await import(pathToFileURL(resolve(cwd, file)).href)) as Record<string, unknown>;
      for (const value of Object.values(mod)) {
        if (isPgTable(value)) {
          tables[getTableName(value)] = value;
        }
      }
    }
    return tables;
  } finally {
    await unregister();
  }
}
