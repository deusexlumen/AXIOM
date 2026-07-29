import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { addRoute } from "@/cli/commands/add-route.js";
import { writeContext } from "@/cli/manifest/mutate.js";
import { countLoc } from "@/cli/commands/add-helpers.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { noopStream } from "@/cli/commands/validate.integration.context.js";
import { runPipeline, parseReport, readPacket } from "@/cli/commands/validate.integration.run.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const HeaderTsx = `export function Header() {
  return <header data-axm-id="Header"><h1>AXIOM</h1></header>;
}
`;

const CardTsx = `export function Card({ title = "" }: { title?: string }) {
  return <article data-axm-id="Card"><h2>{title}</h2></article>;
}
`;

const ButtonTsx = `export function Button({ label = "" }: { label?: string }) {
  return <button data-axm-id="Button" type="button">{label}</button>;
}
`;

const CardGridTsx = `import { Header } from "@/components/Header";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export function CardGrid() {
  return (
    <main data-axm-id="CardGrid">
      <Header />
      <div className="grid grid-cols-3 gap-4">
        <Card title="One" />
        <Card title="Two" />
        <Card title="Three" />
      </div>
      <Button label="Load more" />
    </main>
  );
}
`;

async function updateComponentFile(dir: string, name: string, content: string): Promise<void> {
  const file = `src/components/${name}.tsx`;
  writeFileSync(join(dir, file), content);
  const ctx = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
  const entry = ctx.components.find((c) => c.name === name);
  if (entry === undefined) throw new Error(`${name} missing`);
  entry.loc = countLoc(content);
  entry.bytes = Buffer.byteLength(content);
  await writeContext(dir, ctx);
}

describe("S-06 acceptance scenario", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-s06-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("scaffolds an accessible page and runs the pipeline green", { timeout: 300000 }, async () => {
    await init("s06", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const dir = join(baseDir, "s06");
    await installAppDeps(dir);

    await addComponent("Header", { cwd: dir, out: noopStream() });
    await addComponent("Card", { cwd: dir, out: noopStream() });
    await addComponent("Button", { cwd: dir, out: noopStream() });
    await addComponent("CardGrid", { cwd: dir, out: noopStream() });
    await addRoute("/", { component: "CardGrid", cwd: dir, out: noopStream() });

    await updateComponentFile(dir, "Header", HeaderTsx);
    await updateComponentFile(dir, "Card", CardTsx);
    await updateComponentFile(dir, "Button", ButtonTsx);
    await updateComponentFile(dir, "CardGrid", CardGridTsx);

    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";
    const { exitCode, stdout } = await runPipeline(dir);
    const data = parseReport(stdout);
    if (data.report.packetFile !== null) {
      const packet = readPacket(dir, data.report.packetFile);
      console.error(JSON.stringify(packet));
    }
    expect(exitCode).toBe(0);
    expect(data.ok).toBe(true);
    expect(data.report.result).toBe("GREEN");
    expect(data.report.failedStage).toBeNull();
  });
});
