import { relative, resolve } from "node:path";
import { readLeases, withLeaseLock } from "@/cli/leases/store.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

function normalize(cwd: string, file: string): string {
  return relative(cwd, resolve(cwd, file)).replace(/\\/g, "/");
}

function isExpired(lease: { heartbeatAt: string; ttlSeconds: number }, now: number): boolean {
  return now - new Date(lease.heartbeatAt).getTime() > lease.ttlSeconds * 1000;
}

function isCovered(target: string, scope: string[]): boolean {
  return scope.some((entry) => target === entry || target.startsWith(`${entry}/`));
}

export async function requireActiveLease(cwd: string, agentId: string, targetFiles: string[]): Promise<void> {
  const targets = targetFiles.map((f) => normalize(cwd, f));
  const now = Date.now();
  const leases = await withLeaseLock(cwd, () => readLeases(cwd));
  const active = leases.find(
    (l) => l.agentId === agentId && !isExpired(l, now) && targets.every((t) => isCovered(t, l.scope))
  );
  if (active) return;
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-M003", `No active lease covers ${targets.join(", ")}`, ["I-17"])),
    ExitCode.LEASE_ERROR
  );
}
