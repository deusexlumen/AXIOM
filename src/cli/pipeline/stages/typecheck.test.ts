import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runTypecheckStage } from "@/cli/pipeline/stages/typecheck.js";

function installPnpmMock(binDir: string, exitCode: number, stderr: string, stdout: string): void {
  const scriptPath = join(binDir, "pnpm-mock.js");
  writeFileSync(
    scriptPath,
    `process.stdout.write(${JSON.stringify(stdout)});\nprocess.stderr.write(${JSON.stringify(stderr)});\nprocess.exit(${exitCode});\n`
  );
  writeFileSync(join(binDir, "pnpm"), `#!/bin/sh\nexec node "$(dirname "$0")/pnpm-mock.js" "$@"\n`);
  writeFileSync(join(binDir, "pnpm.cmd"), `@echo off\nnode "%~dp0pnpm-mock.js" %*\n`);
}

describe("runTypecheckStage", () => {
  let baseDir: string;
  let originalPath: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-typecheck-stage-test-"));
    originalPath = process.env.PATH ?? "";
    const binDir = join(baseDir, "bin");
    mkdirSync(binDir);
    installPnpmMock(
      binDir,
      1,
      "src/components/Demo.tsx(7,23): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.\n",
      ""
    );
    process.env.PATH = `${binDir};${originalPath}`;
  });

  afterEach(() => {
    process.env.PATH = originalPath;
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("returns AXM-T001 packet with parsed TS error", async () => {
    const result = await runTypecheckStage(baseDir);
    expect(result.ok).toBe(false);
    expect(result.packet?.errorCode).toBe("AXM-T001");
    expect(result.packet?.target.file).toBe("src/components/Demo.tsx");
    expect(result.packet?.target.line).toBe(7);
    expect(result.packet?.target.column).toBe(23);
    expect(result.packet?.rawEvidence).toMatchObject({ tsCode: "TS2345" });
  });
});
