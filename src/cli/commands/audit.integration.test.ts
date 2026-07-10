import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { parsePacket } from "@/cli/commands/integration-helpers.js";
import {
  makeAuditProject,
  setLoosePin,
  removeNpmrc,
  corruptLockHash,
  installVulnerablePackage,
  recordLockfile,
  runAudit,
} from "@/cli/commands/audit.integration.helpers.js";

describe("axm audit integration", () => {
  let base: string;

  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), "axiom-audit-integ-"));
    execSync("pnpm build", { cwd: process.cwd(), stdio: "ignore" });
  }, 300000);

  afterAll(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

  it("reports AXM-S001 for a ^ version", async () => {
    const dir = await makeAuditProject(base, "s001");
    setLoosePin(dir);
    const { exitCode, stdout } = await runAudit(dir);
    expect(exitCode).toBe(90);
    expect(parsePacket(stdout).errorCode).toBe("AXM-S001");
  }, 60000);

  it("reports AXM-S004 when ignore-scripts=true is missing", async () => {
    const dir = await makeAuditProject(base, "s004");
    removeNpmrc(dir);
    const { exitCode, stdout } = await runAudit(dir);
    expect(exitCode).toBe(90);
    expect(parsePacket(stdout).errorCode).toBe("AXM-S004");
  }, 60000);

  it("reports AXM-S003 when the lockfile hash mismatches", async () => {
    const dir = await makeAuditProject(base, "s003");
    await corruptLockHash(dir);
    const { exitCode, stdout } = await runAudit(dir);
    expect(exitCode).toBe(90);
    expect(parsePacket(stdout).errorCode).toBe("AXM-S003");
  }, 60000);

  it("reports AXM-S002 for a high audit finding", async () => {
    const dir = await makeAuditProject(base, "s002");
    installVulnerablePackage(dir);
    await recordLockfile(dir);
    const { exitCode, stdout } = await runAudit(dir);
    expect(exitCode).toBe(90);
    expect(parsePacket(stdout).errorCode).toBe("AXM-S002");
  }, 120000);
});
