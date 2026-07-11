import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AuditContext } from "@/cli/security/audit.js";
import { buildSecurityPacket } from "@/cli/security/packet.js";

const EXACT_SEMVER = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
const ALLOWED_PROTOCOLS = ["workspace:", "file:", "link:"];

export function isExactVersion(version: string): boolean {
  if (ALLOWED_PROTOCOLS.some((prefix) => version.startsWith(prefix))) return true;
  return EXACT_SEMVER.test(version);
}

function collectLoosePins(pkg: Record<string, unknown>): string[] {
  const loose: string[] = [];
  for (const key of ["dependencies", "devDependencies"]) {
    const section = pkg[key];
    if (section && typeof section === "object" && !Array.isArray(section)) {
      for (const [name, version] of Object.entries(section)) {
        if (typeof version === "string" && !isExactVersion(version)) {
          loose.push(`${name}@${version}`);
        }
      }
    }
  }
  return loose;
}

export async function checkExactPinning(ctx: AuditContext): Promise<FixPacket | null> {
  const loose = collectLoosePins(ctx.packageJson);
  if (loose.length === 0) return null;
  return buildSecurityPacket(
    "AXM-S001",
    "package.json",
    `Found ${loose.length} package(s) without exact version pinning`,
    { packages: loose },
    "Dependencies use semantic range operators or non-semver references instead of exact versions.",
    "Pin every dependency to an exact version (e.g. 1.2.3) or an allowed protocol (workspace:, file:, link:)."
  );
}
