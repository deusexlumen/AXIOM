import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AuditContext } from "@/cli/security/audit.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";

export async function checkLockfileIntegrity(ctx: AuditContext): Promise<FixPacket | null> {
  if (!ctx.lockfileHash) {
    return buildSecurityPacket(
      "AXM-S003",
      "pnpm-lock.yaml",
      "pnpm-lock.yaml could not be hashed",
      {},
      "pnpm-lock.yaml is missing or unreadable.",
      "Ensure pnpm-lock.yaml exists and is readable."
    );
  }

  if (!ctx.manifestHash) {
    return buildSecurityPacket(
      "AXM-S003",
      "pnpm-lock.yaml",
      "agent-context.json has no recorded hash for pnpm-lock.yaml",
      { computed: ctx.lockfileHash },
      "Lockfile integrity was not recorded in agent-context.json.",
      "Run the context update command to record the current lockfile hash."
    );
  }

  if (ctx.lockfileHash === ctx.manifestHash) return null;

  return buildSecurityPacket(
    "AXM-S003",
    "pnpm-lock.yaml",
    "pnpm-lock.yaml hash does not match agent-context.json",
    { computed: ctx.lockfileHash, expected: ctx.manifestHash },
    "The lockfile was modified without updating the integrity record.",
    "Review lockfile changes and update agent-context.json integrity."
  );
}
