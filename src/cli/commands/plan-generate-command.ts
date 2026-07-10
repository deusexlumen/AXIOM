import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { generatePlan } from "@/cli/commands/plan-generate.js";
import { writeOrderFile, readOrderFiles } from "@/cli/commands/plan-fs.js";
import { loadVision, upsertVision, countOrders, PlanOptions } from "@/cli/commands/plan-common.js";

export async function runPlan(args: string[], options: PlanOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const { value: visionPath } = takeValue(args, "--vision");
  const vision = await loadVision(cwd, visionPath ?? "VISION.axm.json");
  const plan = generatePlan(vision);

  for (const order of plan.orders) await writeOrderFile(cwd, order);

  const context = await readContext(cwd);
  context.visions = context.visions ?? [];
  const awaitingVeto = vision.vetoGates.includes("post-plan");
  upsertVision(context.visions, vision.visionId, awaitingVeto ? "PLANNED" : "APPROVED");
  context.orders = countOrders(await readOrderFiles(cwd, "open"), await readOrderFiles(cwd, "blocked"));
  await writeContext(cwd, context);

  result(
    {
      visionId: vision.visionId,
      orders: plan.orders.length,
      dagDepth: plan.dagDepth,
      criticalPath: plan.criticalPath,
      awaitingVeto,
    },
    options.out
  );
}
