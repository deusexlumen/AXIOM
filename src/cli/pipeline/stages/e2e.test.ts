import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { runE2eStage } from "@/cli/pipeline/stages/e2e.js";

function installPnpmMock(binDir: string, exitCode: number, stdout: string): void {
  const scriptPath = join(binDir, "pnpm-mock.js");
  writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(stdout)});\nprocess.exit(${exitCode});\n`
  );
  writeFileSync(join(binDir, "pnpm"), `#!/bin/sh\nexec node "$(dirname "$0")/pnpm-mock.js" "$@"\n`);
  writeFileSync(join(binDir, "pnpm.cmd"), `@echo off\nnode "%~dp0pnpm-mock.js" %*\n`);
}

function makeReport(message: string): string {
  return JSON.stringify({
    suites: [
      {
        file: "e2e/Demo.spec.ts",
        specs: [
          {
            ok: false,
            title: "Demo page",
            tests: [{ results: [{ error: { message } }] }],
          },
        ],
      },
    ],
  });
}

describe("runE2eStage", () => {
  let baseDir: string;
  let originalPath: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-e2e-stage-test-"));
    mkdirSync(join(baseDir, "e2e"));
    writeFileSync(join(baseDir, "e2e", "Demo.spec.ts"), "");
    originalPath = process.env.PATH ?? "";
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns AXM-E001 packet from stub Playwright JSON report", async () => {
    const binDir = join(baseDir, "bin");
    mkdirSync(binDir);
    installPnpmMock(binDir, 1, makeReport("Timeout 5000ms exceeded."));
    process.env.PATH = `${binDir}${delimiter}${originalPath}`;
    const result = await runE2eStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-E001");
    expect(result.packet?.target.file).toBe("e2e/Demo.spec.ts");
    expect(result.packet?.rawEvidence).toMatchObject({ testName: "Demo page" });
    expect(result.packet?.invariantsAffected).toEqual(["I-13"]);
  });

  it("returns AXM-E010 packet when the failure message mentions accessibility", async () => {
    const binDir = join(baseDir, "bin");
    mkdirSync(binDir);
    installPnpmMock(binDir, 1, makeReport("1 accessibility violation was detected (axe-core)."));
    process.env.PATH = `${binDir}${delimiter}${originalPath}`;
    const result = await runE2eStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-E010");
    expect(result.packet?.target.file).toBe("e2e/Demo.spec.ts");
    expect(result.packet?.rawEvidence).toMatchObject({ testName: "Demo page" });
    expect(result.packet?.invariantsAffected).toEqual(["I-13", "I-09"]);
  });
});
