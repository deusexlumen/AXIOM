import { requireArg, takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { orderList } from "@/cli/commands/order-list.js";
import { orderClaim } from "@/cli/commands/order-claim.js";
import { orderComplete } from "@/cli/commands/order-complete.js";
import { orderRelease } from "@/cli/commands/order-release.js";

export async function orderCommand(args: string[]): Promise<void> {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === "list") return orderList(rest);
  if (sub === "claim") {
    const orderId = requireArg(rest[0], "<orderId>");
    const { value: agentId } = takeValue(rest.slice(1), "--agent");
    return orderClaim(orderId, requireArg(agentId, "--agent <agentId>"));
  }
  if (sub === "complete") return orderComplete(requireArg(rest[0], "<orderId>"));
  if (sub === "release") return orderRelease(requireArg(rest[0], "<orderId>"));
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown order subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
