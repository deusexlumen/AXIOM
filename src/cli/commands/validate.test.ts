import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { validate } from "@/cli/commands/validate.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

const baseContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:aa" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("validate command", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-validate-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("passes for valid context with matching hashes", async () => {
    writeFileSync(join(baseDir, "tokens.json"), "{}");
    const h = await hashFile(join(baseDir, "tokens.json"));
    const context = { ...baseContext, tokens: { file: "tokens.json", hash: h } };
    await writeAgentContext(baseDir, context);
    await expect(validate(baseDir, noopStream())).resolves.toBeUndefined();
  });

  it("throws CliError for invalid agent-context.json", async () => {
    writeFileSync(join(baseDir, "agent-context.json"), "{\"invalid\":true}");
    await expect(validate(baseDir, noopStream())).rejects.toBeInstanceOf(CliError);
    await expect(validate(baseDir, noopStream())).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });

  it("throws CliError for hash mismatch", async () => {
    writeFileSync(join(baseDir, "tokens.json"), "{}");
    const context = { ...baseContext, tokens: { file: "tokens.json", hash: "sha256:old" } };
    await writeAgentContext(baseDir, context);
    await expect(validate(baseDir, noopStream())).rejects.toBeInstanceOf(CliError);
    await expect(validate(baseDir, noopStream())).rejects.toMatchObject({ exitCode: ExitCode.OWNERSHIP_ERROR });
  });
});
