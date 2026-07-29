import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import { checkExactPinning } from "@/cli/security/pinning.js";
import { checkIgnoreScripts } from "@/cli/security/scripts.js";
import { checkLockfileIntegrity } from "@/cli/security/lockfile.js";
import { checkAuditFindings } from "@/cli/security/pnpm-audit.js";

export interface AuditContext {
  cwd: string;
  packageJson: Record<string, unknown>;
  lockfileHash: string;
  manifestHash: string | null;
}

export async function runAudit(ctx: AuditContext): Promise<FixPacket[]> {
  const checks = [
    checkExactPinning,
    checkIgnoreScripts,
    checkLockfileIntegrity,
    checkAuditFindings,
  ];
  const out: FixPacket[] = [];
  for (const check of checks) {
    const packet = await check(ctx);
    if (packet) out.push(packet);
  }
  return out;
}
