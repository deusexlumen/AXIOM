import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deployCommand } from "@/cli/commands/deploy.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { makeProject, cleanProject, noopAudit, greenPipeline } from "./deploy.test-helpers.js";

describe("deployCommand migration hash abort", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    cleanProject(dir);
  });

  it("aborts on migration hash mismatch", async () => {
    const context = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
    context.db!.migrationHashes["0000_init.sql"] =
      "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    await writeAgentContext(dir, context);
    await expect(
      deployCommand([], { cwd: dir, env: "preview", audit: noopAudit, runPipelineFn: greenPipeline })
    ).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });
});
