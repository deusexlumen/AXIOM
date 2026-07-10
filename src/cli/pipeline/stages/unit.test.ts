import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runUnitStage } from "@/cli/pipeline/stages/unit.js";

function installPnpmMock(binDir: string, exitCode: number, stdout: string): void {
  const scriptPath = join(binDir, "pnpm-mock.js");
  writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(stdout)});\nprocess.exit(${exitCode});\n`
  );
  writeFileSync(join(binDir, "pnpm"), `#!/bin/sh\nexec node "$(dirname "$0")/pnpm-mock.js" "$@"\n`);
  writeFileSync(join(binDir, "pnpm.cmd"), `@echo off\nnode "%~dp0pnpm-mock.js" %*\n`);
}

describe("runUnitStage", () => {
  let baseDir: string;
  let originalPath: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-unit-stage-test-"));
    originalPath = process.env.PATH ?? "";
    const binDir = join(baseDir, "bin");
    mkdirSync(binDir);
    const report = JSON.stringify({
      testResults: [
        {
          status: "failed",
          name: "src/components/Demo.test.tsx",
          assertionResults: [
            {
              status: "failed",
              fullName: "Demo should render",
              failureMessages: ["AssertionError: expected true to be false"],
              location: { line: 12 },
            },
          ],
        },
      ],
    });
    installPnpmMock(binDir, 1, report);
    process.env.PATH = `${binDir};${originalPath}`;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns AXM-U001 packet with first failing assertion", async () => {
    const result = await runUnitStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-U001");
    expect(result.packet?.target.file).toBe("src/components/Demo.test.tsx");
    expect(result.packet?.target.line).toBe(12);
    expect(result.packet?.rawEvidence).toMatchObject({ testName: "Demo should render" });
  });
});
