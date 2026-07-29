import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { noopStream } from "@/cli/commands/validate.integration.context.js";
import { runPipeline, parseReport, readPacket } from "@/cli/commands/validate.integration.run.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");
const fixturePath: string = join(process.cwd(), "test", "fixtures", "contracts", "tasks.contract.ts");

function runIn(dir: string, command: string): void {
  execSync(`node ${binPath} ${command}`, { cwd: dir, stdio: "ignore" });
}

describe("contract pipeline stage", () => {
  let baseDir: string;
  let appDir: string;

  beforeAll(async () => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-contract-stage-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    appDir = join(baseDir, "demo");
    await installAppDeps(appDir);
    cpSync(fixturePath, join(appDir, "tasks.contract.ts"));
    runIn(appDir, "api add tasks --contract ./tasks.contract.ts");
  }, 600000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  beforeEach(() => {
    cpSync(fixturePath, join(appDir, "api", "contracts", "tasks.contract.ts"));
    const fetcher = join(appDir, "src", "components", "Fetcher.tsx");
    if (existsSync(fetcher)) rmSync(fetcher, { force: true });
  });

  it("passes after axm api add", { timeout: 120000 }, async () => {
    const { exitCode, stdout } = await runPipeline(appDir, ["--stage", "contract"]);
    expect(exitCode).toBe(0);
    expect(parseReport(stdout).report.result).toBe("GREEN");
  });

  it("fails with AXM-C004 when contract is modified without build", { timeout: 120000 }, async () => {
    const contractFile = join(appDir, "api", "contracts", "tasks.contract.ts");
    const content = readFileSync(contractFile, "utf-8"); // missing readFileSync import
    writeFileSync(contractFile, content.replace('path: "/tasks"', 'path: "/tasks-changed"'));
    const { exitCode, stdout } = await runPipeline(appDir, ["--stage", "contract"]);
    expect(exitCode).toBe(0);
    const data = parseReport(stdout);
    expect(data.report.result).toBe("RED");
    expect(data.report.failedStage).toBe("contract");
    expect(readPacket(appDir, data.report.packetFile!).errorCode).toBe("AXM-C004");
  });

  it("fails with AXM-C002 for raw fetch in component", { timeout: 120000 }, async () => {
    writeFileSync(
      join(appDir, "src", "components", "Fetcher.tsx"),
      'export function Fetcher() { fetch("/x"); return <div data-axm-id="Fetcher" />; }\n'
    );
    const { exitCode, stdout } = await runPipeline(appDir, ["--stage", "contract"]);
    expect(exitCode).toBe(0);
    const data = parseReport(stdout);
    expect(data.report.result).toBe("RED");
    expect(data.report.failedStage).toBe("contract");
    expect(readPacket(appDir, data.report.packetFile!).errorCode).toBe("AXM-C002");
  });
});
