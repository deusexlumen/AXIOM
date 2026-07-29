import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { contextSliceCommand } from "@/cli/commands/context.js";
import {
  noopStream,
  captureStream,
  parseLastLine,
  linkComponentChain,
} from "@/cli/commands/context.integration.helpers.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

function runIn(dir: string, command: string): string {
  const cmd = `node ${binPath} ${command}`;
  return execSync(cmd, { cwd: dir, encoding: "utf-8" });
}

function parseResult(raw: string): { ok: boolean; data: Record<string, unknown> } {
  const data = parseLastLine(raw);
  return { ok: data.ok as boolean, data };
}

describe("axm context slice", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-context-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("produces a minimal context slice for a component with dependencies", { timeout: 120000 }, async () => {
    const app = join(baseDir, "slice");
    await init("slice", { cwd: baseDir, skipInstall: true, out: noopStream() });
    runIn(app, "add component Child");
    runIn(app, "add component Parent");

    const contextPath = join(app, "agent-context.json");
    const context = JSON.parse(readFileSync(contextPath, "utf-8")) as {
      project: { tokenBudget: { hardLimitPerSlice: number } };
      components: Array<{ name: string; dependsOn: string[]; usedBy: string[] }>;
    };
    const parent = context.components.find((c) => c.name === "Parent");
    const child = context.components.find((c) => c.name === "Child");
    if (!parent || !child) throw new Error("Components not created");
    parent.dependsOn = ["Child"];
    child.usedBy = ["Parent"];
    writeFileSync(contextPath, JSON.stringify(context, null, 2));

    const raw = runIn(app, "context slice --for src/components/Parent.tsx");
    const response = parseResult(raw);
    expect(response.ok).toBe(true);
    const data = response.data;
    expect(data.target).toBe("src/components/Parent.tsx");

    const files = data.files as Array<{ path: string; content: string }>;
    const paths = files.map((f) => f.path);
    expect(paths).toContain("src/components/Parent.tsx");
    expect(paths).toContain("src/components/Parent.spec.json");
    expect(paths).toContain("src/components/Parent.test.tsx");
    expect(paths).toContain("src/components/Child.tsx");
    expect(paths).toContain("src/components/Child.spec.json");
    expect(paths).toContain("tokens.json");

    const tokenCount = data.tokenCount as number;
    expect(tokenCount).toBeGreaterThan(0);
    expect(tokenCount).toBeLessThan(context.project.tokenBudget.hardLimitPerSlice);
  });

  it("stays under the 8000 token hard limit for a 30-component chain", { timeout: 120000 }, async () => {
    const dir = join(baseDir, "scale");
    await init("scale", { cwd: baseDir, skipInstall: true, out: noopStream() });
    for (let i = 0; i < 30; i++) {
      await addComponent(`Component_${i}`, { cwd: dir, out: noopStream() });
    }
    linkComponentChain(dir, 30);

    const capture = captureStream();
    await contextSliceCommand({ target: "src/components/Component_29.tsx", cwd: dir, out: capture.stream });
    const data = parseLastLine(capture.output());
    expect(data.ok).toBe(true);
    expect(data.target).toBe("src/components/Component_29.tsx");
    expect(typeof data.tokenCount).toBe("number");
    expect(data.tokenCount).toBeLessThan(8000);
    expect(Array.isArray(data.files)).toBe(true);
  });
});
