import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Writable } from "node:stream";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { getCommandHandler } from "@/cli/commands/registry.js";
import { init } from "@/cli/commands/init.js";
import { createServer } from "@/cli/mcp/server.js";
import { captureStdout } from "@/cli/mcp/capture.js";
import type { NdjsonLine } from "@/cli/types.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

function briefFixture(): unknown {
  return {
    track: "bespoke",
    brand: { name: "X", oneLiner: "Y", existingAssets: [], voice: ["präzise"] },
    audience: { who: "Z", device: "balanced", attention: "explorativ" },
    goal: { primary: "awareness", successMetric: "visits" },
    references: [
      { url: "https://a.com", liked: ["a"], disliked: [] },
      { url: "https://b.com", liked: ["b"], disliked: [] },
    ],
    mood: { words: ["m"], antiWords: ["n"] },
    content: { sections: ["hero"], assets: "vorhanden" },
    constraints: { deadlineDays: 14, mustHave: [], verboten: [] },
    webglAppetite: 0,
  };
}

async function callCli(command: string, args: string[]): Promise<NdjsonLine[]> {
  const handler = getCommandHandler(command);
  if (handler === undefined) throw new Error(`Unknown command: ${command}`);
  const { lines } = await captureStdout(() => handler(args));
  return lines;
}

async function callMcpTool(name: string, args: Record<string, unknown>): Promise<NdjsonLine[]> {
  const server = createServer();
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "1.0.0" }, { capabilities: {} });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const result = (await client.callTool({ name, arguments: args })) as CallToolResult;
  const text = result.content.find((item) => item.type === "text")?.text ?? "[]";
  return JSON.parse(text) as NdjsonLine[];
}

function resultData(lines: NdjsonLine[]): unknown[] {
  return lines.filter((line) => line.type === "result").map((line) => line.data);
}

const cases: { command: string; args: string[]; tool: string; toolArgs: Record<string, unknown> }[] = [
  { command: "tokens", args: ["build"], tool: "atelier_tokens_build", toolArgs: {} },
  { command: "motion", args: ["build"], tool: "atelier_motion_build", toolArgs: {} },
  { command: "pattern", args: ["list"], tool: "atelier_pattern_list", toolArgs: {} },
  { command: "critic", args: ["run"], tool: "atelier_critic_run", toolArgs: {} },
  { command: "brief", args: ["validate"], tool: "atelier_brief_validate", toolArgs: {} },
  { command: "direct", args: ["choose", "dir_A"], tool: "atelier_direct_choose", toolArgs: { id: "dir_A" } },
];

describe("atelier-mcp golden tests", () => {
  let baseDir: string;
  let projectDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-mcp-golden-"));
    projectDir = join(baseDir, "site");
  });

  afterEach(() => {
    process.chdir(tmpdir());
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("produces CLI-equivalent results for core tools", { timeout: 120000 }, async () => {
    await init("site", { cwd: baseDir, skipInstall: true, out: noopStream() });
    writeFileSync(resolve(projectDir, "BRIEF.axm.json"), `${JSON.stringify(briefFixture(), null, 2)}\n`, "utf-8");
    process.chdir(projectDir);
    await callCli("direct", ["generate"]);

    for (const { command, args, tool, toolArgs } of cases) {
      const cli = resultData(await callCli(command, args));
      const mcp = resultData(await callMcpTool(tool, toolArgs));
      expect(mcp).toEqual(cli);
    }
  });
});
