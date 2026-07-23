import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runCritic } from "@/cli/commands/critic.js";
import { init } from "@/cli/commands/init.js";
import { CriticReport } from "@/cli/schemas/critic-report.js";
import { CRITIC_REPORT_PATH } from "@/cli/pipeline/stages/critic.js";
import { noopStream, captureStream } from "@/cli/critic/test-fixtures.js";
import { createGenericSite } from "@/cli/critic/generic-site-fixture.js";
import { createCuratedProject } from "@/cli/critic/curated-site-fixture.js";

describe("runCritic", () => {
  let baseDir: string;
  beforeEach(() => { baseDir = mkdtempSync(join(tmpdir(), "axiom-critic-cmd-test-")); });
  afterEach(() => { rmSync(baseDir, { recursive: true, force: true }); });

  it("reports generic site with low antiTemplate score", async () => {
    createGenericSite(baseDir);
    await runCritic({ cwd: baseDir, out: noopStream() });
    const report = CriticReport.parse(JSON.parse(readFileSync(resolve(baseDir, CRITIC_REPORT_PATH), "utf-8")));
    expect(report.rubrics.antiTemplate).toBeLessThanOrEqual(2);
  });

  it("reports init fixture project as valid with scores >= 1", { timeout: 30000 }, async () => {
    await init("site", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const projectDir = resolve(baseDir, "site");
    await runCritic({ cwd: projectDir, out: noopStream() });
    const report = CriticReport.parse(JSON.parse(readFileSync(resolve(projectDir, CRITIC_REPORT_PATH), "utf-8")));
    expect(report.overall).toBeGreaterThanOrEqual(1);
    Object.values(report.rubrics).forEach((score) => expect(score).toBeGreaterThanOrEqual(1));
  });

  it("reports curated direction-preset project as valid", async () => {
    createCuratedProject(baseDir);
    await runCritic({ cwd: baseDir, out: noopStream() });
    const report = CriticReport.parse(JSON.parse(readFileSync(resolve(baseDir, CRITIC_REPORT_PATH), "utf-8")));
    expect(report.rubrics.directionalFidelity).toBeGreaterThanOrEqual(1);
    expect(report.rubrics.antiTemplate).toBeGreaterThanOrEqual(1);
  });

  it("outputs NDJSON result with report path", async () => {
    createCuratedProject(baseDir);
    const { stream, lines } = captureStream();
    await runCritic({ cwd: baseDir, out: stream });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ type: "result", ok: true });
    expect((lines[0] as { data: { report: string } }).data.report).toBe(resolve(baseDir, CRITIC_REPORT_PATH));
  });
});
