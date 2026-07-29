import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { runPlan } from "@/cli/commands/plan-generate-command.js";
import { runApprove } from "@/cli/commands/plan-approve-command.js";
import { runReject } from "@/cli/commands/plan-reject-command.js";
import { runReplan } from "@/cli/commands/plan-replan-command.js";
import { PlanOptions } from "@/cli/commands/plan-common.js";

export type { PlanOptions };

export async function planCommand(args: string[], options: PlanOptions = {}): Promise<void> {
  const sub = args[0];
  if (!sub || sub.startsWith("--")) return runPlan(args, options);
  if (sub === "approve") return runApprove(args.slice(1), options);
  if (sub === "reject") return runReject(args.slice(1), options);
  if (sub === "replan") return runReplan(args.slice(1), options);
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown plan subcommand: ${sub}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
