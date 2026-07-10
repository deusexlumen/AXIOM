import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export function buildSecurityPacket(
  errorCode: string,
  targetFile: string,
  message: string,
  rawEvidence: Record<string, unknown>,
  probableCause: string,
  fixHint: string,
  severity: "BLOCKING" | "WARNING" = "BLOCKING"
): FixPacket {
  return {
    packetId: `sec_${errorCode.toLowerCase()}`,
    runId: "cli_audit",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity,
    target: { file: targetFile },
    message,
    rawEvidence,
    probableCause,
    fixHint,
    invariantsAffected: [],
    agentInstruction: `Correct ${targetFile} and re-run axm audit`,
  };
}
