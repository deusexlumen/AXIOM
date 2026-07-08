import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function runValidate(dir: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const result = await execa({ cwd: dir })`node ${process.cwd()}/dist/cli/bin.js validate`;
    return { exitCode: result.exitCode ?? 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const e = error as { exitCode?: number; stdout?: string; stderr?: string };
    return { exitCode: e.exitCode ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("axm validate invariant fixtures", () => {
  it("reports AXM-V002 for a file exceeding byte budget", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    mkdirSync(join(dir, "src", "components"), { recursive: true });
    writeFileSync(
      join(dir, "agent-context.json"),
      JSON.stringify({
        axiomVersion: "1.0.0",
        project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
        components: [
          {
            name: "Big",
            file: "src/components/Big.tsx",
            spec: "src/components/Big.spec.json",
            test: "src/components/Big.test.tsx",
            exports: ["Big"],
            dependsOn: [],
            usedBy: [],
            loc: 10,
            bytes: 4096,
            status: "STALE",
            specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
            lastPipelineRun: "2026-07-08T00:00:00Z",
          },
        ],
        routes: [],
        stores: [],
        tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
        integrity: { lockedFiles: {}, machineFiles: {} },
        pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
      })
    );
    writeFileSync(join(dir, "tokens.json"), "{}");
    const bigContent = "x".repeat(5000);
    writeFileSync(join(dir, "src", "components", "Big.tsx"), `export function Big() { return <div>${bigContent}</div>; }\n`);
    writeFileSync(
      join(dir, "src", "components", "Big.spec.json"),
      JSON.stringify({ name: "Big", description: "Big", props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] })
    );

    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(10);
    const last = stdout.trim().split("\n").pop();
    expect(last).toBeTruthy();
    const line = JSON.parse(last!);
    const packet = line.type === "result" && line.ok === false ? line.data : line;
    expect(packet.errorCode).toBe("AXM-V002");
  });

  it("reports AXM-V010 for a component placed in a LOCKED zone", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    mkdirSync(join(dir, "src", "core"), { recursive: true });
    writeFileSync(
      join(dir, "agent-context.json"),
      JSON.stringify({
        axiomVersion: "1.0.0",
        project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
        components: [
          {
            name: "Bad",
            file: "src/core/router.ts",
            spec: "src/core/router.spec.json",
            test: "src/core/router.test.tsx",
            exports: ["Bad"],
            dependsOn: [],
            usedBy: [],
            loc: 10,
            bytes: 100,
            status: "GREEN",
            specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
            lastPipelineRun: "2026-07-08T00:00:00Z",
          },
        ],
        routes: [],
        stores: [],
        tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
        integrity: { lockedFiles: { "src/core/router.ts": "sha256:aaa" }, machineFiles: {} },
        pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
      })
    );
    writeFileSync(join(dir, "tokens.json"), "{}");
    writeFileSync(join(dir, "src", "core", "router.ts"), "export function Bad() { return null; }\n");
    writeFileSync(
      join(dir, "src", "core", "router.spec.json"),
      JSON.stringify({ name: "Bad", description: "Bad", props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] })
    );

    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(10);
    const last = stdout.trim().split("\n").pop();
    expect(last).toBeTruthy();
    const line = JSON.parse(last!);
    const packet = line.type === "result" && line.ok === false ? line.data : line;
    expect(packet.errorCode).toBe("AXM-V010");
  });
});
