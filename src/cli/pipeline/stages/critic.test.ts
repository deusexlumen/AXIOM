import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runCriticStage, CRITIC_REPORT_PATH } from "@/cli/pipeline/stages/critic.js";
import { CriticReport } from "@/cli/schemas/critic-report.js";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

describe("runCriticStage", () => {
  let baseDir: string;
  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-critic-stage-test-"));
    mkdirSync(resolve(baseDir, "app"), { recursive: true });
    mkdirSync(resolve(baseDir, "src", "generated"), { recursive: true });
    writeJson(resolve(baseDir, "tokens.json"), { color: { action: { primary: "#3B82F6" } } });
    writeFileSync(resolve(baseDir, "src/generated/theme.css"), `:root { --color-action-primary: #3B82F6; }`, "utf-8");
    writeJson(resolve(baseDir, "MOTION.axm.json"), {
      ease: { out: { curve: [0.25, 0.1, 0.25, 1], meaning: "power1" } },
      dur: { micro: 0.18, max: 2 }, stagger: {},
      scroll: { lenis: { lerp: 0.1 }, scrubDefault: 0.8, pinSpacing: true },
      transitions: {}, choreography: { revealOrder: [], maxConcurrentTimelines: 3 },
      reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
    });
    writeFileSync(resolve(baseDir, "app/page.tsx"), `export default function Home() { return <h1>Hi</h1>; }`, "utf-8");
  });
  afterEach(() => { rmSync(baseDir, { recursive: true, force: true }); });

  it("returns ok=true and writes a schema-valid CRITIC_REPORT.json", async () => {
    const result = await runCriticStage(baseDir);
    expect(result.ok).toBe(true);
    expect(existsSync(resolve(baseDir, CRITIC_REPORT_PATH))).toBe(true);
    const raw = JSON.parse(readFileSync(resolve(baseDir, CRITIC_REPORT_PATH), "utf-8")) as unknown;
    const report = CriticReport.parse(raw);
    expect(report.overall).toBeGreaterThanOrEqual(1);
    expect(report.overall).toBeLessThanOrEqual(5);
    expect(report.model).toBe("heuristic");
  });

  it("records route scope when provided", async () => {
    await runCriticStage(baseDir, ["route:/about"]);
    const raw = JSON.parse(readFileSync(resolve(baseDir, CRITIC_REPORT_PATH), "utf-8")) as unknown;
    const report = CriticReport.parse(raw);
    expect(report.route).toBe("/about");
  });
});
