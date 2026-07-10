import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deployCommand } from "@/cli/commands/deploy.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import {
  captureStream,
  makeProject,
  cleanProject,
  noopAudit,
  greenPipeline,
} from "@/cli/commands/deploy.test-helpers.js";

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

function s001Audit(): never {
  throw new CliError(
    JSON.stringify(
      buildSecurityPacket(
        "AXM-S001",
        "package.json",
        "Loose pin",
        {},
        "Dependencies are not pinned exactly.",
        "Pin every dependency to an exact version."
      )
    ),
    ExitCode.SECURITY_ERROR
  );
}

describe("axm deploy integration", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeProject();
  });

  afterEach(() => {
    cleanProject(dir);
    delete process.env.AXIOM_DEPLOY_MOCK_URL;
  });

  it("stops at audit when an S-error is present", async () => {
    process.env.AXIOM_DEPLOY_MOCK_URL = "https://demo.example.com";
    let caught: CliError | undefined;
    try {
      await deployCommand([], {
        cwd: dir,
        env: "local",
        audit: s001Audit,
        runPipelineFn: greenPipeline,
      });
    } catch (error) {
      caught = error as CliError;
    }
    expect(caught?.exitCode).toBe(ExitCode.SECURITY_ERROR);
    expect(JSON.parse(caught?.message ?? "{}").errorCode).toBe("AXM-S001");
  });

  it("stops at the pre-deploy veto gate", async () => {
    process.env.AXIOM_DEPLOY_MOCK_URL = "https://demo.example.com";
    writeVision(dir);
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "local",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.awaitingVeto).toBe(true);
  });

  it("returns the mock URL when the veto is approved", async () => {
    process.env.AXIOM_DEPLOY_MOCK_URL = "https://demo.example.com";
    mkdirSync(join(dir, "orders/active"), { recursive: true });
    writeFileSync(join(dir, "orders/active/pre-deploy.json"), JSON.stringify({ status: "APPROVED" }));
    writeVision(dir);
    const cap = captureStream();
    await deployCommand([], {
      cwd: dir,
      env: "local",
      out: cap.stream,
      audit: noopAudit,
      runPipelineFn: greenPipeline,
    });
    const line = JSON.parse(cap.output().trim().split("\n").pop()!);
    expect(line.data.ok).toBe(true);
    expect(line.data.url).toBe("https://demo.example.com");
  });
});
