import { ExitCode } from "@/cli/types.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function cliFixPacket(errorCode: string, message: string, invariants: string[]): FixPacket {
  return {
    packetId: `cli_${errorCode.toLowerCase()}_${Date.now()}`,
    runId: "cli",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity: "BLOCKING",
    target: { file: "cli" },
    message,
    rawEvidence: {},
    probableCause: "CLI input does not satisfy the command contract.",
    fixHint: "Check the command usage and required arguments.",
    invariantsAffected: invariants,
    agentInstruction: "Correct the CLI invocation and retry.",
  };
}
