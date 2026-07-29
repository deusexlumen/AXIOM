import { runLedgerEnforcement } from "@/cli/ledger/enforce.js";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export async function checkLedger(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  const violations = await runLedgerEnforcement(cwd, context);
  if (violations.length === 0) return null;
  const first = violations[0]!;
  const entry = first.entry;
  return {
    ...buildPipelinePacket(
      "AXM-Q001",
      `Ledger decision ${entry.id} violated: ${entry.decision}`,
      first.file,
      1,
      1,
      "validate",
      ["I-16"]
    ),
    ledgerRefs: [entry.id],
    agentInstruction: `Do not work around ledger entry ${entry.id}. Escalate if the decision needs revision.`,
  };
}
