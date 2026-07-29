import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAntiTemplateHeuristic, heuristicCountByRubric } from "@/cli/critic/anti-template.js";
import { createGenericSite } from "@/cli/critic/generic-site-fixture.js";

describe("runAntiTemplateHeuristic", () => {
  let baseDir: string;
  beforeEach(() => { baseDir = mkdtempSync(join(tmpdir(), "axiom-critic-test-")); });
  afterEach(() => { rmSync(baseDir, { recursive: true, force: true }); });

  it("recognizes a prepared generic site with at least 4 findings", async () => {
    createGenericSite(baseDir);
    const findings = await runAntiTemplateHeuristic(baseDir);
    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(heuristicCountByRubric(findings, "antiTemplate")).toBeGreaterThanOrEqual(2);
  });

  it("returns no findings for an empty project", async () => {
    const findings = await runAntiTemplateHeuristic(baseDir);
    expect(findings).toEqual([]);
  });
});
