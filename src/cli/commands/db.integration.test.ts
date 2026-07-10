import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";

const binPath = join(process.cwd(), "dist", "cli", "bin.js");

function run(dir: string, command: string): void {
  execSync(`node ${binPath} ${command}`, { cwd: dir, stdio: "ignore" });
}

function runError(dir: string, command: string): { code: number; out: string } {
  try {
    return { code: 0, out: execSync(`node ${binPath} ${command}`, { cwd: dir, encoding: "utf-8" }) };
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    return { code: err.status ?? 1, out: err.stdout ?? "" };
  }
}

function schema(): string {
  return `import { pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  done: boolean("done").notNull().default(false),
});
`;
}

describe("axm db integration", () => {
  let base: string;
  let app: string;

  beforeAll(async () => {
    base = mkdtempSync(join(tmpdir(), "axiom-db-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
    await init("demo", { cwd: base, skipInstall: true });
    app = join(base, "demo");
    installAppDeps(app);
    writeFileSync(join(app, "db", "schema", "tasks.ts"), schema());
  }, 300000);

  afterAll(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

  it("generates a migration and records hashes", { timeout: 300000 }, async () => {
    run(app, "db migrate gen");
    const files = readdirSync(join(app, "db", "migrations")).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBe(1);
    const ctx = JSON.parse(readFileSync(join(app, "agent-context.json"), "utf-8"));
    expect(ctx.db.schemaFiles).toContain("db/schema/tasks.ts");
    expect(ctx.db.migrationHead).toBe(files[0]);
    expect(ctx.db.migrationHashes[files[0]!]).toMatch(/^sha256:/);
  });

  it("applies migrations and seeds deterministically", { timeout: 300000 }, async () => {
    run(app, "db migrate apply");
    const fixture = join(app, "tasks-seed.json");
    writeFileSync(fixture, JSON.stringify({ tasks: [{ title: "A", done: false }] }));
    run(app, "db seed --fixture ./tasks-seed.json");
    const client = new PGlite(join(app, ".axiom", "db.sqlite"));
    const result = await client.query("SELECT title, done FROM tasks");
    expect(result.rows).toEqual([{ title: "A", done: false }]);
  });

  it("detects manipulated migrations as AXM-D002", { timeout: 300000 }, async () => {
    const files = readdirSync(join(app, "db", "migrations")).filter((f) => f.endsWith(".sql"));
    const path = join(app, "db", "migrations", files[0]!);
    writeFileSync(path, `${readFileSync(path, "utf-8")}\n-- tamper`);
    const { code, out } = runError(app, "db migrate apply");
    expect(code).toBe(10);
    expect(out).toContain("AXM-D002");
  });
});
