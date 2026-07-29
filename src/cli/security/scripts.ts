import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AuditContext } from "@/cli/security/audit.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";

const LIFECYCLE_SCRIPTS = new Set(["preinstall", "install", "postinstall", "prepare"]);

function hasNpmrcIgnoreScripts(content: string): { ok: true } | { ok: false; lineCount: number } {
  const normalized = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  const hasIgnoreScripts = normalized.some((line) => {
    const [key, ...rest] = line.split("=");
    return key?.trim() === "ignore-scripts" && rest.join("=").trim() === "true";
  });
  return hasIgnoreScripts ? { ok: true } : { ok: false, lineCount: normalized.length };
}

function collectLifecycleScripts(pkg: Record<string, unknown>): string[] {
  const scripts = pkg.scripts;
  if (!scripts || typeof scripts !== "object" || Array.isArray(scripts)) return [];
  return Object.keys(scripts).filter((name) => LIFECYCLE_SCRIPTS.has(name));
}

export async function checkIgnoreScripts(ctx: AuditContext): Promise<FixPacket | null> {
  const npmrcPath = resolve(ctx.cwd, ".npmrc");
  let npmrcOk = false;
  let npmrcLineCount = 0;
  let npmrcMissing = false;
  try {
    const content = await readFile(npmrcPath, "utf-8");
    const result = hasNpmrcIgnoreScripts(content);
    if (result.ok) {
      npmrcOk = true;
    } else {
      npmrcLineCount = result.lineCount;
    }
  } catch {
    npmrcMissing = true;
  }

  const lifecycle = collectLifecycleScripts(ctx.packageJson);

  if (npmrcOk && lifecycle.length === 0) return null;

  const evidence: Record<string, unknown> = {};
  if (!npmrcOk) {
    evidence.hasIgnoreScripts = false;
    evidence.npmrcMissing = npmrcMissing;
    evidence.npmrcLineCount = npmrcLineCount;
  }
  if (lifecycle.length > 0) {
    evidence.lifecycleScripts = lifecycle;
  }

  return buildSecurityPacket(
    "AXM-S004",
    ".npmrc",
    "ignore-scripts protection is incomplete",
    evidence,
    npmrcMissing
      ? ".npmrc does not exist or cannot be read."
      : npmrcOk
        ? "package.json contains lifecycle scripts that can execute arbitrary code."
        : ".npmrc exists but does not set ignore-scripts=true.",
    npmrcMissing
      ? "Create .npmrc and add ignore-scripts=true."
      : "Add ignore-scripts=true to .npmrc and remove dangerous lifecycle scripts from package.json."
  );
}
