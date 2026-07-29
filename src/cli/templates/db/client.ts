export function pgliteClientTs(): string {
  return `import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbPath = process.env.PGLITE_DB ?? ".axiom/db.sqlite";
mkdirSync(dirname(dbPath), { recursive: true });

const client = new PGlite(dbPath);

export const db = drizzle(client);
`;
}
