import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { runLintStage } from "@/cli/pipeline/stages/lint.js";

function installPnpmMock(binDir: string, exitCode: number, stdout: string): void {
  const scriptPath = join(binDir, "pnpm-mock.js");
  writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(stdout)});\nprocess.exit(${exitCode});\n`
  );
  const shScript = join(binDir, "pnpm");
  writeFileSync(shScript, `#!/bin/sh\nexec node "$(dirname "$0")/pnpm-mock.js" "$@"\n`);
  chmodSync(shScript, 0o755);
  writeFileSync(join(binDir, "pnpm.cmd"), `@echo off\nnode "%~dp0pnpm-mock.js" %*\n`);
}

describe("runLintStage", () => {
  let baseDir: string;
  let originalPath: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-lint-stage-test-"));
    originalPath = process.env.PATH ?? "";
    const binDir = join(baseDir, "bin");
    mkdirSync(binDir);
    const eslintOutput = JSON.stringify([
      {
        filePath: `${baseDir.replace(/\\/g, "/")}/src/components/Demo.tsx`,
        messages: [{ line: 3, column: 1, message: "Relative imports are not allowed.", ruleId: "axiom/absolute-imports" }],
      },
    ]);
    installPnpmMock(binDir, 1, eslintOutput);
    process.env.PATH = `${binDir}${delimiter}${originalPath}`;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns AXM-L001 packet with first ESLint message", async () => {
    const result = await runLintStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-L001");
    expect(result.packet?.target.file).toBe("src/components/Demo.tsx");
    expect(result.packet?.target.line).toBe(3);
    expect(result.packet?.rawEvidence).toMatchObject({ ruleId: "axiom/absolute-imports" });
  });
});
