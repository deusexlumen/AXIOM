import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { writeOrderFile, readOrderFiles } from "@/cli/commands/plan-fs.js";
import { loadBrief } from "@/cli/commands/brief.js";
import { generateTrackPlan } from "@/cli/commands/plan-generate-track.js";
import { upsertVision, countOrders, PlanOptions } from "@/cli/commands/plan-common.js";

export async function runPlan(args: string[], options: PlanOptions): Promise<void> {
  void args;
  const cwd = options.cwd ?? process.cwd();
  const brief = await loadBrief(cwd);
  const plan = generateTrackPlan({ brief });

  for (const order of plan.orders) await writeOrderFile(cwd, order);

  const context = await readContext(cwd);
  context.visions = context.visions ?? [];
  upsertVision(context.visions, plan.planId, "PLANNED");
  context.orders = countOrders(await readOrderFiles(cwd, "open"), await readOrderFiles(cwd, "blocked"));
  await writeContext(cwd, context);

  result(
    {
      planId: plan.planId,
      track: plan.track,
      orders: plan.orders.length,
      dagDepth: plan.dagDepth,
      criticalPath: plan.criticalPath,
      awaitingVeto: plan.track === "bespoke",
    },
    options.out
  );
}
