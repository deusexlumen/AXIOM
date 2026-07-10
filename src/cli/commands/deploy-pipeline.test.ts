import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { deployCommand } from "@/cli/commands/deploy.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { makeProject, cleanProject, noopAudit, redPipeline } from "./deploy.test-helpers.js";

describe("deployCommand pipeline abort", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    cleanProject(dir);
  });

  it("aborts when the pipeline is RED", async () => {
    await expect(
      deployCommand([], { cwd: dir, env: "local", audit: noopAudit, runPipelineFn: redPipeline })
    ).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });
});
