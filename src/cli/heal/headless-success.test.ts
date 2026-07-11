import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { headlessHeal } from "@/cli/heal/headless.js";
import { writeHeadlessFixture, greenRun, noopStream } from "@/cli/heal/headless.test-helpers.js";

describe("headlessHeal success", () => {
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

  it("applies a patch and succeeds when the pipeline turns GREEN", async () => {
    await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {});
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      const patches = calls === 1 ? [{ file: "src/components/Box.tsx", content: "export function Box() {}" }] : [];
      return { ok: true, json: async () => ({ patches }) } as unknown as Response;
    };
    await headlessHeal({
      cwd: baseDir,
      out: noopStream(),
      fetchImpl,
      runPipeline: async () => greenRun(),
      maxRetries: 2,
    });
    expect(readFileSync(join(baseDir, "src/components/Box.tsx"), "utf-8")).toBe("export function Box() {}");
  });

  it("skips when disabled in config", async () => {
    const fetchImpl = await writeHeadlessFixture(baseDir, false, "src/components/Box.tsx", {
      patches: [{ file: "src/components/Box.tsx", content: "export function Box() {}" }],
    });
    await headlessHeal({
      cwd: baseDir,
      out: noopStream(),
      fetchImpl,
      runPipeline: async () => greenRun(),
      maxRetries: 1,
    });
    expect(existsSync(join(baseDir, "src/components/Box.tsx"))).toBe(false);
  });

  it("skips when ci.headlessHeal is omitted", async () => {
    const fetchImpl = await writeHeadlessFixture(baseDir, undefined, "src/components/Box.tsx", {
      patches: [{ file: "src/components/Box.tsx", content: "export function Box() {}" }],
    });
    await headlessHeal({
      cwd: baseDir,
      out: noopStream(),
      fetchImpl,
      runPipeline: async () => greenRun(),
      maxRetries: 1,
    });
    expect(existsSync(join(baseDir, "src/components/Box.tsx"))).toBe(false);
  });
});
