import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext } from "@/cli/manifest/mutate.js";
import { verifyMigrationHashes } from "@/cli/commands/db-helpers.js";

export async function dbMigrateDryRun(cwd: string): Promise<void> {
  // Dry-run only verifies the local migration hash chain; no live connection is opened.
  const context = await readContext(cwd);
  await verifyMigrationHashes(cwd, context);
}

export async function checkPreDeployVeto(cwd: string): Promise<boolean> {
  const visionPath = resolve(cwd, "VISION.axm.json");
  let vision: { vetoGates?: string[] } | undefined;
  try {
    vision = JSON.parse(await readFile(visionPath, "utf-8")) as { vetoGates?: string[] };
  } catch {
    return false;
  }
  if (!vision?.vetoGates?.includes("pre-deploy")) return false;
  const orderPath = resolve(cwd, "orders/active/pre-deploy.json");
  try {
    const order = JSON.parse(await readFile(orderPath, "utf-8")) as { status?: string };
    if (order.status === "APPROVED") return false;
  } catch {
    // no approved order
  }
  return true;
}

export function runVercelDeploy(cwd: string, prod: boolean): string {
  const mockUrl = process.env.AXIOM_DEPLOY_MOCK_URL;
  if (mockUrl) return mockUrl;
  const args = prod ? ["deploy", "--prod"] : ["deploy"];
  const output = execFileSync("vercel", args, { cwd, encoding: "utf-8", stdio: "pipe" });
  const lines = output.trim().split("\n");
  return lines[lines.length - 1] ?? "";
}
