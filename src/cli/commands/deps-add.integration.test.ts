import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { noopStream } from "@/cli/commands/context.integration.helpers.js";
import { parseResult, parsePacket, runAxm } from "@/cli/commands/integration-helpers.js";

describe("axm deps add integration", () => {
  let base: string;

  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), "axiom-deps-add-integ-"));
  }, 300000);

  afterAll(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

  it("adds zod@4.4.3 and updates the lockfile hash", async () => {
    const app = join(base, "add");
    await init("add", { cwd: base, skipInstall: true, out: noopStream() });

    const result = await runAxm(app, ["deps", "add", "zod@4.4.3"], { AXIOM_DEPS_NO_PNPM: "1" });
    expect(result.exitCode).toBe(0);
    expect(parseResult(result.stdout).added).toBe("zod@4.4.3");

    const pkg = JSON.parse(readFileSync(join(app, "package.json"), "utf-8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies.zod).toBe("4.4.3");

    const ctx = JSON.parse(readFileSync(join(app, "agent-context.json"), "utf-8")) as {
      integrity: { machineFiles: Record<string, string> };
    };
    expect(ctx.integrity.machineFiles["pnpm-lock.yaml"]).toBeDefined();
  }, 60000);

  it("reports AXM-Q001 when the ledger forbids the dependency", async () => {
    const app = join(base, "forbidden");
    await init("forbidden", { cwd: base, skipInstall: true, out: noopStream() });

    const rule = JSON.stringify({ type: "forbidden-dependency", match: ["dayjs"] });
    const add = await runAxm(app, [
      "ledger",
      "add",
      "--decision",
      "Avoid dayjs",
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

    const result = await runAxm(app, ["deps", "add", "dayjs@1.0.0"], { AXIOM_DEPS_NO_PNPM: "1" });
    expect(result.exitCode).toBe(80);
    expect(parsePacket(result.stdout).errorCode).toBe("AXM-Q001");
  }, 60000);
});
