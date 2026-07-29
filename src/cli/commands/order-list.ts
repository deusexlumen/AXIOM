import { takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { readOrderFiles } from "@/cli/commands/plan-fs.js";
import { WorkOrderStatus } from "@/cli/schemas/work-order.js";
import { result } from "@/cli/utils/ndjson.js";

export async function orderList(args: string[]): Promise<void> {
  const { value: status } = takeValue(args, "--status");
  const open = await readOrderFiles(process.cwd(), "open");
  const blocked = await readOrderFiles(process.cwd(), "blocked");
  let orders = [...open, ...blocked];
  if (status) {
    if (!WorkOrderStatus.options.includes(status as WorkOrderStatus)) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-V000", `Invalid status: ${status}`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    orders = orders.filter((o) => o.status === status);
  }
  result({
    orders: orders.map((o) => ({
      orderId: o.orderId,
      status: o.status,
      claimedBy: o.claimedBy,
      dependsOn: o.dependsOn,
    })),
  });
}
