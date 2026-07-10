import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { execa } from "execa";
import { init } from "@/cli/commands/init.js";
import { noopStream, parseLastLine } from "@/cli/commands/context.integration.helpers.js";

const binPath = join(process.cwd(), "dist", "cli", "bin.js");

type Packet = { errorCode: string; ledgerRefs?: string[] };
type ResultLine = { type?: string; ok?: boolean; data: Record<string, unknown> };

function parseResult(stdout: string): Record<string, unknown> {
  const line = parseLastLine(stdout) as ResultLine;
  return line.type === "result" && line.ok === true ? line.data : line;
}

function parsePacket(stdout: string): Packet {
  const line = parseLastLine(stdout) as ResultLine;
  return (line.type === "result" && line.ok === false ? line.data : line) as Packet;
}

async function runAxm(dir: string, args: string[]): Promise<{ exitCode: number; stdout: string }> {
  const result = await execa("node", [binPath, ...args], { cwd: dir, reject: false });
  return { exitCode: result.exitCode ?? 0, stdout: result.stdout };
}

function addForbiddenDependency(dir: string): void {
  const path = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf-8")) as { dependencies: Record<string, string> };
  pkg.dependencies["some-forbidden-pkg"] = "1.0.0";
  writeFileSync(path, JSON.stringify(pkg, null, 2));
}

describe("axm ledger integration", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-ledger-integ-"));
    execSync("pnpm build", { cwd: process.cwd(), stdio: "ignore" });
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 300000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("adds and queries ledger entries", async () => {
    const app = join(baseDir, "ledger");
    await init("ledger", { cwd: baseDir, skipInstall: true, out: noopStream() });

    const rule = JSON.stringify({ type: "forbidden-dependency", match: ["some-forbidden-pkg"] });
    const add = await runAxm(app, [
      "ledger",
      "add",
      "--decision",
      "Avoid some-forbidden-pkg",
      "--rationale",
      "Security risk",
      "--scope",
      "project",
      "--class",
      "enforced",
      "--rule",
      rule,
    ]);
    expect(add.exitCode).toBe(0);
    const addData = parseResult(add.stdout);
    expect(addData.ok).toBe(true);

    const query = await runAxm(app, ["ledger", "query", "--scope", "project"]);
    expect(query.exitCode).toBe(0);
    const queryData = parseResult(query.stdout);
    const entries = queryData.entries as Array<{ id: string; decision: string }>;
    expect(entries.length).toBe(1);
    expect(entries[0]?.id).toBe("DEC-0001");
    expect(entries[0]?.decision).toBe("Avoid some-forbidden-pkg");
  }, 120000);

  it("reports AXM-Q001 with ledgerRefs DEC-0001 for a forbidden dependency", async () => {
    const app = join(baseDir, "validate");
    await init("validate", { cwd: baseDir, skipInstall: true, out: noopStream() });

    const rule = JSON.stringify({ type: "forbidden-dependency", match: ["some-forbidden-pkg"] });
    await runAxm(app, [
      "ledger",
      "add",
      "--decision",
      "Avoid some-forbidden-pkg",
      "--rationale",
      "Security risk",
      "--scope",
      "project",
      "--class",
      "enforced",
      "--rule",
      rule,
    ]);

    addForbiddenDependency(app);

    const result = await runAxm(app, ["validate", "--ledger"]);
    expect(result.exitCode).toBe(80);
    const packet = parsePacket(result.stdout);
    expect(packet.errorCode).toBe("AXM-Q001");
    expect(packet.ledgerRefs).toEqual(["DEC-0001"]);
  }, 120000);
});
