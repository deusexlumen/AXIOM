import { requireArg, takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { leaseList } from "@/cli/commands/lease-list.js";
import { leaseHeartbeat } from "@/cli/commands/lease-heartbeat.js";
import { leaseReclaim } from "@/cli/commands/lease-reclaim.js";

export async function leaseCommand(args: string[]): Promise<void> {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === "list") return leaseList();
  if (sub === "heartbeat") {
    const { value: agentId } = takeValue(rest, "--agent");
    return leaseHeartbeat(requireArg(agentId, "--agent <id>"));
  }
  if (sub === "reclaim") return leaseReclaim();
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown lease subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
