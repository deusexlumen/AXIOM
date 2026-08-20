// The Track-B (BESPOKE) counterpart to s-20.integration.test.ts. Getting this
// green required six framework fixes, all of the same shape: a gate that
// checked an artifact's form but never its runtime effect. See
// docs/superpowers/plans/2026-07-12-atelier-a8-acceptance.md.
//
// The cursor-system assertion below is load-bearing: it sizes itself with
// `h-4 w-4`, so it collapses to a 0x0 box and reports as hidden if the scaffold
// ever stops emitting Tailwind utilities again. Do not soften it.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, cpSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { init } from "@/cli/commands/init.js";
import { addPattern } from "@/cli/commands/pattern-add.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { runAxm, parseResult } from "@/cli/commands/integration-helpers.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile } from "@/cli/manifest/hash.js";

const fixtureDir = resolve(process.cwd(), "src/cli/fixtures/track-b-portfolio");
const patterns = ["cursor-system", "depth-gallery", "flowmap-hero", "page-mask-transition", "split-reveal"];

async function rehashMachineFiles(appDir: string): Promise<void> {
  const context = await readContext(appDir);
  for (const file of Object.keys(context.integrity.machineFiles)) {
    if (file === "agent-context.json") continue;
    // .contract.ts files are hashed structurally (contractHash), not by raw
    // content; the fixture never touches them, so the hash init() wrote stays valid.
    if (file.endsWith(".contract.ts")) continue;
    context.integrity.machineFiles[file] = await hashFile(resolve(appDir, file));
  }
  if (context.tokens.file) {
    context.tokens.hash = await hashFile(resolve(appDir, context.tokens.file));
  }
  await writeContext(appDir, context);
}

describe("S-20 Track-B end-to-end", () => {
  let baseDir: string;
  let appDir: string;

  beforeEach(async () => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-s20-b-"));
    appDir = join(baseDir, "portfolio");
    await init("portfolio", { cwd: baseDir, skipInstall: true });
  }, 120000);

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 });
  });

  it(
    "scaffolds, adds patterns, runs pipeline, deploys and passes CRITIC",
    { timeout: 600000 },
    async () => {
      await installAppDeps(appDir);

      for (const name of patterns) {
        await addPattern(name, { cwd: appDir });
      }

      cpSync(fixtureDir, appDir, { recursive: true, force: true });
      await rehashMachineFiles(appDir);

      const brief = await runAxm(appDir, ["brief", "validate"]);
      expect(brief.exitCode).toBe(0);

      const tokens = await runAxm(appDir, ["tokens", "build"]);
      expect(tokens.exitCode).toBe(0);

      const motion = await runAxm(appDir, ["motion", "build"]);
      expect(motion.exitCode).toBe(0);

      const pipeline = await runAxm(appDir, ["pipeline", "run"]);
      const pipelineData = parseResult(pipeline.stdout);
      if (pipeline.exitCode !== 0 || (pipelineData.report as { result?: string }).result !== "GREEN") {
        console.log("=== PIPELINE STDOUT ===");
        console.log(pipeline.stdout);
        const packetFile = join(
          appDir,
          String((pipelineData.report as { packetFile?: string }).packetFile)
        );
        if (existsSync(packetFile)) {
          console.log("=== PACKET FILE ===");
          console.log(readFileSync(packetFile, "utf-8"));
        }
      }
      expect(pipeline.exitCode).toBe(0);
      expect(pipelineData.report).toMatchObject({ result: "GREEN", failedStage: null });

      const deploy = await runAxm(appDir, ["deploy", "--env", "preview"], {
        AXIOM_DEPLOY_MOCK_URL: "https://portfolio-preview.axiom.studio",
      });
      expect(deploy.exitCode).toBe(0);
      const deployData = parseResult(deploy.stdout);
      expect(deployData.url).toBe("https://portfolio-preview.axiom.studio");

      const reportPath = join(appDir, "CRITIC_REPORT.json");
      expect(existsSync(reportPath)).toBe(true);
      const critic = JSON.parse(readFileSync(reportPath, "utf-8")) as {
        rubrics: { directionalFidelity: number; antiTemplate: number };
      };
      expect(critic.rubrics.directionalFidelity).toBeGreaterThanOrEqual(4);
      expect(critic.rubrics.antiTemplate).toBeGreaterThanOrEqual(4);
    }
  );
});
