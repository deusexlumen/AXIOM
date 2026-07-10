import { requireArg } from "@/cli/bin-helpers.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { readOrderFiles, moveToBlocked } from "@/cli/commands/plan-fs.js";
import { upsertVision, countOrders, missingVisionError, PlanOptions } from "@/cli/commands/plan-common.js";

export async function runReject(args: string[], options: PlanOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const visionId = requireArg(args[0], "<visionId>");
  const { value: reason } = takeValue(args.slice(1), "--reason");
  if (!reason) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --reason <text>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const context = await readContext(cwd);
  const visions = context.visions ?? [];
  const summary = visions.find((v) => v.visionId === visionId);
  if (!summary) missingVisionError(visionId);
  summary.status = "REJECTED";

  let blocked = 0;
  for (const order of await readOrderFiles(cwd, "open")) {
    if (order.visionId !== visionId) continue;
    await moveToBlocked(cwd, order, reason);
    blocked++;
  }

  context.orders = countOrders(await readOrderFiles(cwd, "open"), await readOrderFiles(cwd, "blocked"));
  await writeContext(cwd, context);
  result({ visionId, status: "REJECTED", blocked }, options.out);
}
