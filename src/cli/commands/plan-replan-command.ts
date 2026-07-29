import { takeValue } from "@/cli/bin-helpers.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { BriefJson } from "@/cli/schemas/brief.js";
import { loadBrief } from "@/cli/commands/brief.js";
import { generateTrackPlan } from "@/cli/commands/plan-generate-track.js";
import { writeOrderFile, readOrderFiles, moveToBlocked } from "@/cli/commands/plan-fs.js";
import { deepMerge } from "@/cli/commands/plan-merge.js";
import { parseDelta, upsertVision, countOrders, preserveActiveState, PlanOptions } from "@/cli/commands/plan-common.js";

export async function runReplan(args: string[], options: PlanOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const { value: deltaRaw } = takeValue(args, "--delta");
  const { value: planId } = takeValue(args, "--plan");
  if (!deltaRaw) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --delta <text|json>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const context = await readContext(cwd);
  const visions = context.visions ?? [];
  const targetId = planId ?? visions[0]?.visionId;
  if (!targetId) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", "No plan found to replan", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const existing = await readOrderFiles(cwd, "open");
  const existingMap = new Map(existing.filter((o) => o.visionId === targetId).map((o) => [o.orderId, o]));

  const brief = await loadBrief(cwd);
  deepMerge(brief as unknown as Record<string, unknown>, parseDelta(deltaRaw));
  const plan = generateTrackPlan({ brief: BriefJson.parse(brief) });
  if (plan.planId !== targetId) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", `BRIEF.axm.json does not match planId ${targetId}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const newIds = new Set(plan.orders.map((o) => o.orderId));

  const blockedIds: string[] = [];
  for (const [id, oldOrder] of existingMap) {
    if (oldOrder.status === "DONE") continue;
    if (oldOrder.status === "CLAIMED" || oldOrder.status === "IN_PROGRESS") {
      const replacement = plan.orders.find((o) => o.orderId === id);
      if (replacement) preserveActiveState(replacement, oldOrder);
      continue;
    }
    if (!newIds.has(id)) {
      await moveToBlocked(cwd, oldOrder, "obsoleted by replan delta");
      blockedIds.push(id);
    }
  }

  for (const order of plan.orders) {
    const old = existingMap.get(order.orderId);
    if (old?.status === "DONE") continue;
    if (old && (old.status === "CLAIMED" || old.status === "IN_PROGRESS")) preserveActiveState(order, old);
    await writeOrderFile(cwd, order);
  }

  upsertVision(visions, targetId, "PLANNED");
  context.orders = countOrders(await readOrderFiles(cwd, "open"), await readOrderFiles(cwd, "blocked"));
  await writeContext(cwd, context);

  result(
    {
      planId: targetId,
      orders: plan.orders.length,
      blockedIds,
      dagDepth: plan.dagDepth,
      criticalPath: plan.criticalPath,
    },
    options.out
  );
}
