import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { headlessHeal } from "@/cli/heal/headless.js";
import { writeHeadlessFixture } from "@/cli/heal/headless.test-helpers.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("headlessHeal", () => {
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

  it("applies a patch inside the allowed scope", async () => {
    await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {});
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      const patches = calls === 1 ? [{ file: "src/components/Box.tsx", content: "export function Box() {}" }] : [];
      return { ok: true, json: async () => ({ patches }) } as unknown as Response;
    };
    await headlessHeal({ cwd: baseDir, out: noopStream(), fetchImpl, maxRetries: 2 });
    expect(readFileSync(join(baseDir, "src/components/Box.tsx"), "utf-8")).toBe("export function Box() {}");
  });

  it("ignores patches outside the allowed scope", async () => {
    const targets = [
      ".github/workflows/axiom.yml",
      "src/core/router.ts",
      "tokens.json",
      "src/generated/x.ts",
      "src/routes/x.ts",
      "api/generated/x.ts",
    ];
    const fetchImpl = await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {
      patches: targets.map((file) => ({ file, content: "bad" })),
    });
    await headlessHeal({ cwd: baseDir, out: noopStream(), fetchImpl, maxRetries: 1 });
    for (const target of targets) {
      expect(existsSync(join(baseDir, target))).toBe(false);
    }
  });

  it("escalates when retries are exhausted", async () => {
    const fetchImpl = await writeHeadlessFixture(baseDir, true, "src/components/Box.tsx", {
      patches: [{ file: "src/components/Box.tsx", content: "export function Box() {}" }],
    });
    await expect(headlessHeal({ cwd: baseDir, out: noopStream(), fetchImpl, maxRetries: 1 })).rejects.toThrow(
      "Headless heal failed"
    );
    expect(existsSync(join(baseDir, "pipeline", "reports", "escalation_headless_r1.json"))).toBe(true);
  });

  it("skips when disabled in config", async () => {
    const fetchImpl = await writeHeadlessFixture(baseDir, false, "src/components/Box.tsx", {
      patches: [{ file: "src/components/Box.tsx", content: "export function Box() {}" }],
    });
    await headlessHeal({ cwd: baseDir, out: noopStream(), fetchImpl, maxRetries: 1 });
    expect(existsSync(join(baseDir, "src/components/Box.tsx"))).toBe(false);
  });
});
