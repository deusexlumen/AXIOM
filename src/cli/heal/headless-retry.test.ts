import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headlessHeal } from "@/cli/heal/headless.js";
import { writeHeadlessFixture, redRun, noopStream } from "@/cli/heal/headless.test-helpers.js";

describe("headlessHeal retry", () => {
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

  it("escalates when retries are exhausted", async () => {
    const fetchImpl = await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {
      patches: [{ file: "src/components/Box.tsx", content: "export function Box() {}" }],
    });
    await expect(
      headlessHeal({
        cwd: baseDir,
        out: noopStream(),
        fetchImpl,
        runPipeline: async () => redRun(baseDir, "r1"),
        maxRetries: 1,
      })
    ).rejects.toThrow("Headless heal failed");
    expect(existsSync(join(baseDir, "pipeline", "reports", "escalation_headless_r1.json"))).toBe(true);
  });
});
