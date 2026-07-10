import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { deployCommand } from "@/cli/commands/deploy.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { makeProject, cleanProject, greenPipeline } from "./deploy.test-helpers.js";

describe("deployCommand audit abort", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    cleanProject(dir);
  });

  it("aborts when audit reports a security finding", async () => {
    await expect(
      deployCommand([], { cwd: dir, env: "local", runPipelineFn: greenPipeline })
    ).rejects.toMatchObject({ exitCode: ExitCode.SECURITY_ERROR });
  });
});
