import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Writable } from "node:stream";
import { createHash } from "node:crypto";

type Ctx = {
  integrity: { machineFiles: Record<string, string>; lockedFiles: Record<string, string> };
  components: unknown[];
  [key: string]: unknown;
};

export function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

export function writeContext(dir: string, ctx: Ctx): void {
  const copy = JSON.parse(JSON.stringify(ctx)) as Ctx;
  delete copy.integrity.machineFiles["agent-context.json"];
  const hash = `sha256:${createHash("sha256").update(`${JSON.stringify(copy, null, 2)}\n`).digest("hex")}`;
  ctx.integrity.machineFiles["agent-context.json"] = hash;
  writeFileSync(join(dir, "agent-context.json"), `${JSON.stringify(ctx, null, 2)}\n`);
}

export function writeMinimalContext(dir: string, integrity: Ctx["integrity"]): void {
  const tokens = "{}";
  const ctx: Ctx = {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: `sha256:${createHash("sha256").update(tokens).digest("hex")}` },
    integrity,
    pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
  };
  mkdirSync(join(dir, "src", "components"), { recursive: true });
  writeFileSync(join(dir, "tokens.json"), tokens);
  writeContext(dir, ctx);
}
