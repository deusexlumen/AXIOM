import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deployCommand } from "@/cli/commands/deploy.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import {
  captureStream,
  makeProject,
  cleanProject,
  noopAudit,
  greenPipeline,
  mockVercel,
} from "./deploy.test-helpers.js";

function writeVision(dir: string): void {
  writeFileSync(
    join(dir, "VISION.axm.json"),
    JSON.stringify({
      visionId: "v1",
      goal: "g",
      entities: [],
      routes: [],
      constraints: [],
      priorities: [],
      vetoGates: ["pre-deploy"],
      budgets: { maxComponents: 10, maxEndpoints: 10, tokenCeilingTotal: 1000 },
    })
  );
}

describe("deployCommand success paths", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    cleanProject(dir);
    delete process.env.AXIOM_DEPLOY_MOCK_URL;
  });

  it("returns awaitingVeto when a pre-deploy gate exists without approval", async () => {
    writeVision(dir);
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "preview",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
      vercelDeployFn: mockVercel,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.awaitingVeto).toBe(true);
  });

  it("deploys when the pre-deploy veto is approved", async () => {
    mkdirSync(join(dir, "orders/active"), { recursive: true });
    writeFileSync(join(dir, "orders/active/pre-deploy.json"), JSON.stringify({ status: "APPROVED" }));
    writeVision(dir);
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "preview",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
      vercelDeployFn: mockVercel,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.ok).toBe(true);
    expect(line.data.url).toBe("https://demo.example.com");
  });

  it("uses AXIOM_DEPLOY_MOCK_URL when no deploy function is injected", async () => {
    process.env.AXIOM_DEPLOY_MOCK_URL = "https://env.example.com";
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "preview",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.ok).toBe(true);
    expect(line.data.url).toBe("https://env.example.com");
  });

  it("defaults to preview when --env is omitted", async () => {
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
      vercelDeployFn: mockVercel,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.ok).toBe(true);
    expect(line.data.url).toBe("https://demo.example.com");
  });

  it("rejects an invalid --env value", async () => {
    await expect(
      deployCommand(["--env", "staging"], {
        cwd: dir,
        audit: noopAudit,
        runPipelineFn: greenPipeline,
      })
    ).rejects.toMatchObject({ exitCode: ExitCode.VALIDATION_ERROR });
  });
});
