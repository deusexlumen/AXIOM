import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headlessHeal } from "@/cli/heal/headless.js";
import { writeHeadlessFixture, greenRun, noopStream } from "@/cli/heal/headless.test-helpers.js";

describe("headlessHeal scope", () => {
  let baseDir: string;
  const originalEndpoint = process.env.AXIOM_HEAL_MODEL_ENDPOINT;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-headless-"));
    process.env.AXIOM_HEAL_MODEL_ENDPOINT = "http://localhost/model";
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
    if (originalEndpoint === undefined) {
      delete process.env.AXIOM_HEAL_MODEL_ENDPOINT;
    } else {
      process.env.AXIOM_HEAL_MODEL_ENDPOINT = originalEndpoint;
    }
  });

  it("rejects non-AGENT paths", async () => {
    const targets = [
      ".github/workflows/axiom.yml",
      "src/core/router.ts",
      "src/generated/x.ts",
      "src/routes/home.tsx",
      "api/generated/x.ts",
      "package.json",
      "pnpm-lock.yaml",
      "scripts/x.ts",
      "docs/readme.md",
    ];
    const fetchImpl = await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {
      patches: targets.map((file) => ({ file, content: "bad" })),
    });
    await headlessHeal({
      cwd: baseDir,
      out: noopStream(),
      fetchImpl,
      runPipeline: async () => greenRun(),
      maxRetries: 1,
    });
    for (const target of targets) {
      expect(existsSync(join(baseDir, target))).toBe(false);
    }
  });

  it("allows AGENT paths", async () => {
    const files = [
      "src/components/A.tsx",
      "src/state/store.ts",
      "e2e/smoke.spec.ts",
      "api/contracts/tasks.contract.ts",
      "api/handlers/tasks.create.ts",
    ];
    const fetchImpl = await writeHeadlessFixture(baseDir, true, "src/components/A.tsx", {
      patches: files.map((file) => ({ file, content: "export const X = 1;" })),
    });
    await headlessHeal({
      cwd: baseDir,
      out: noopStream(),
      fetchImpl,
      runPipeline: async () => greenRun(),
      maxRetries: 1,
    });
    for (const file of files) {
      expect(readFileSync(join(baseDir, file), "utf-8")).toBe("export const X = 1;");
    }
  });
});
