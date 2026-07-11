import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const binPath = join(process.cwd(), "dist", "cli", "bin.js");

function baseContext(): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: hashString("{}") },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: null },
  } as AgentContext;
}

export async function makeAuditProject(base: string, name: string): Promise<string> {
  const dir = mkdtempSync(join(base, `audit-${name}-`));
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "demo", version: "1.0.0", dependencies: {} }, null, 2)}\n`
  );
  writeFileSync(join(dir, "tokens.json"), "{}");
  writeFileSync(join(dir, ".npmrc"), "ignore-scripts=true\n");
  writeFileSync(join(dir, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  await writeAgentContext(dir, baseContext());
  await recordLockfile(dir);
  return dir;
}

export async function recordLockfile(dir: string): Promise<void> {
  const context = await readContext(dir);
  context.integrity.machineFiles["pnpm-lock.yaml"] = await hashFile(join(dir, "pnpm-lock.yaml"));
  await writeContext(dir, context);
}

export function setLoosePin(dir: string): void {
  const path = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf-8")) as { dependencies: Record<string, string> };
  pkg.dependencies["demo-pkg"] = "^1.0.0";
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

export function removeNpmrc(dir: string): void {
  rmSync(join(dir, ".npmrc"), { force: true });
}

export async function corruptLockHash(dir: string): Promise<void> {
  const context = await readContext(dir);
  context.integrity.machineFiles["pnpm-lock.yaml"] =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000";
  await writeContext(dir, context);
}

export function installVulnerablePackage(dir: string): void {
  const path = join(dir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf-8")) as { dependencies: Record<string, string> };
  pkg.dependencies["drizzle-orm"] = "0.41.0";
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`);
  execFileSync("pnpm", ["install", "--lockfile-only", "--prefer-offline", "--ignore-scripts"], {
    cwd: dir,
    stdio: "ignore",
    timeout: 120000,
  });
}

export async function runAudit(
  dir: string,
  env?: NodeJS.ProcessEnv
): Promise<{ exitCode: number; stdout: string }> {
  const result = await execa("node", [binPath, "audit"], { cwd: dir, reject: false, env });
  return { exitCode: result.exitCode ?? 0, stdout: result.stdout };
}
