import { requireArg } from "@/cli/bin-helpers.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { readOrderFiles } from "@/cli/commands/plan-fs.js";
import { upsertVision, countOrders, missingVisionError, PlanOptions } from "@/cli/commands/plan-common.js";

export async function runApprove(args: string[], options: PlanOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const visionId = requireArg(args[0], "<visionId>");
  const context = await readContext(cwd);
  const visions = context.visions ?? [];
  const summary = visions.find((v) => v.visionId === visionId);
  if (!summary) missingVisionError(visionId);
  summary.status = "APPROVED";
  context.orders = countOrders(await readOrderFiles(cwd, "open"), await readOrderFiles(cwd, "blocked"));
  await writeContext(cwd, context);
  result({ visionId, status: "APPROVED" }, options.out);
}
