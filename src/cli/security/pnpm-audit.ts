import { spawn } from "node:child_process";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AuditContext } from "@/cli/security/audit.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";

type Severity = "info" | "low" | "moderate" | "high" | "critical";
const RANK: Record<Severity, number> = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const SEVERITIES = new Set<string>(Object.keys(RANK));

function rank(value: string): number {
  return SEVERITIES.has(value) ? RANK[value as Severity] : 0;
}

function collectFindings(data: unknown): { title: string; severity: string; module_name?: string }[] {
  const findings: { title: string; severity: string; module_name?: string }[] = [];
  if (!data || typeof data !== "object") return findings;
  const record = data as Record<string, unknown>;
  if (record.advisories && typeof record.advisories === "object") {
    for (const advisory of Object.values(record.advisories)) {
      if (advisory && typeof advisory === "object") {
        const a = advisory as Record<string, unknown>;
        findings.push({
          title: String(a.title ?? ""),
          severity: String(a.severity ?? ""),
          module_name: a.module_name ? String(a.module_name) : undefined,
        });
      }
    }
  }
  if (record.vulnerabilities && typeof record.vulnerabilities === "object") {
    for (const vuln of Object.values(record.vulnerabilities)) {
      if (vuln && typeof vuln === "object") {
        const v = vuln as Record<string, unknown>;
        findings.push({
          title: String(v.name ?? v.vulnerability ?? ""),
          severity: String(v.severity ?? ""),
          module_name: v.name ? String(v.name) : undefined,
        });
      }
    }
  }
  return findings;
}

function runPnpmAudit(cwd: string): Promise<{ data?: unknown; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["audit", "--json"], { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    child.on("error", (error) => {
      resolve({ error: `pnpm audit could not be spawned: ${error.message}` });
    });
    child.on("close", (code) => {
      if (code !== 0 && code !== 1) {
        resolve({ error: `pnpm audit exited with ${code ?? "unknown"}: ${stderr}` });
        return;
      }
      try {
        resolve({ data: JSON.parse(stdout || "{}") });
      } catch {
        resolve({ error: `Invalid JSON from pnpm audit: ${stderr}` });
      }
    });
  });
}

export async function checkAuditFindings(ctx: AuditContext): Promise<FixPacket | null> {
  const audit = await runPnpmAudit(ctx.cwd);
  if (audit.error) {
    return buildSecurityPacket(
      "AXM-S002",
      "pnpm-lock.yaml",
      "pnpm audit could not be completed",
      { error: audit.error },
      "Running pnpm audit failed or returned invalid output.",
      "Ensure pnpm is installed and the registry is reachable, then rerun axm audit.",
      "WARNING"
    );
  }

  const highOrCritical = collectFindings(audit.data).filter((finding) => rank(finding.severity) >= rank("high"));
  if (highOrCritical.length === 0) return null;

  return buildSecurityPacket(
    "AXM-S002",
    "pnpm-lock.yaml",
    `Found ${highOrCritical.length} high/critical audit finding(s)`,
    { findings: highOrCritical },
    "Dependencies contain known high or critical severity vulnerabilities.",
    "Update or replace the affected dependencies and rerun pnpm audit."
  );
}
