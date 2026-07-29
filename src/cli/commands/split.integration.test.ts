import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";
import { addComponent } from "@/cli/commands/add.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { countLoc } from "@/cli/commands/add-helpers.js";
import { noopStream } from "@/cli/commands/validate.integration.context.js";
import { runValidate } from "@/cli/commands/validate.integration.run.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const binPath: string = join(process.cwd(), "dist", "cli", "bin.js");

async function runSplit(dir: string, file: string, at: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const { execa } = await import("execa");
  try {
    const result = await execa("node", [`${process.cwd()}/dist/cli/bin.js`, "split", file, "--at", at], { cwd: dir });
    return { exitCode: result.exitCode ?? 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const e = error as { exitCode?: number; stdout?: string; stderr?: string };
    return { exitCode: e.exitCode ?? 1, stdout: e.stdout ?? "", stderr: e.stderr ?? "" };
  }
}

describe("axm split component", () => {
  let baseDir: string;

  beforeAll(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-split-integ-"));
    execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
  }, 120000);

  afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

  it("splits a helper export into its own component and stays green", { timeout: 120000 }, async () => {
    const name = `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await init(name, { cwd: baseDir, out: noopStream() });
    const dir = join(baseDir, name);
    await addComponent("Card", { cwd: dir, out: noopStream() });

    const cardPath = join(dir, "src/components/Card.tsx");
    const cardContent = `export function CardHeader() { return <div data-axm-id="CardHeader">Header</div>; }\nexport function Card() { return <div data-axm-id="Card"><CardHeader /></div>; }\n`;
    writeFileSync(cardPath, cardContent);

    const context = await readContext(dir);
    const cardEntry = context.components.find((c) => c.name === "Card");
    if (cardEntry === undefined) throw new Error("Card entry missing");
    cardEntry.exports = ["Card", "CardHeader"];
    cardEntry.loc = countLoc(cardContent);
    cardEntry.bytes = cardContent.length;
    cardEntry.status = "STALE";
    await writeContext(dir, context);

    const { exitCode, stdout } = await runSplit(dir, "src/components/Card.tsx", "CardHeader");
    if (exitCode !== 0) console.error(stdout);
    expect(exitCode).toBe(0);

    const cardHeaderTsx = readFileSync(join(dir, "src/components/CardHeader.tsx"), "utf-8");
    expect(cardHeaderTsx).toContain('export function CardHeader()');
    expect(cardHeaderTsx).toContain('data-axm-id="CardHeader"');

    const updatedCard = readFileSync(join(dir, "src/components/Card.tsx"), "utf-8");
    expect(updatedCard).toContain('import { CardHeader } from "@/components/CardHeader";');
    expect(updatedCard).not.toContain('export function CardHeader()');

    const updatedContext = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as AgentContext;
    const headerEntry = updatedContext.components.find((c) => c.name === "CardHeader");
    expect(headerEntry).toBeDefined();
    expect(headerEntry?.usedBy).toContain("Card");
    expect(headerEntry?.exports).toEqual(["CardHeader"]);

    const updatedCardEntry = updatedContext.components.find((c) => c.name === "Card");
    expect(updatedCardEntry?.dependsOn).toContain("CardHeader");
    expect(updatedCardEntry?.exports).toEqual(["Card"]);

    const validateResult = await runValidate(dir);
    expect(validateResult.exitCode).toBe(0);
  });
});
