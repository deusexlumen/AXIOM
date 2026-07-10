import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export function buildPipelinePacket(
  errorCode: string,
  message: string,
  file: string,
  line: number,
  column: number,
  stage: string,
  invariants: string[],
  rawEvidence: Record<string, unknown> = {}
): FixPacket {
  return {
    packetId: `${errorCode.toLowerCase()}_${Date.now()}`,
    runId: "pipeline",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: stage as FixPacket["stage"],
    severity: "BLOCKING",
    target: { file, line, column },
    message,
    rawEvidence,
    probableCause: `Pipeline stage ${stage} failed.`,
    fixHint: "Run the failing stage locally to inspect details.",
    invariantsAffected: invariants,
    agentInstruction: `Correct ${file} and re-run axm pipeline run.`,
  };
}
