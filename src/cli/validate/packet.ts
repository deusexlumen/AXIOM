import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export function buildFixPacket(
  errorCode: string,
  message: string,
  targetFile: string,
  invariants: string[],
  fixHint: string,
  probableCause: string,
  line?: number,
  column?: number
): FixPacket {
  return {
    packetId: `m2_${errorCode.toLowerCase()}`,
    runId: "m2_validate",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity: "BLOCKING",
    target: { file: targetFile, ...(line !== undefined ? { line, column: column ?? 1 } : {}) },
    message,
    rawEvidence: {},
    probableCause,
    fixHint,
    invariantsAffected: invariants,
    agentInstruction: `Correct ${targetFile} and re-run axm validate`,
  };
}
