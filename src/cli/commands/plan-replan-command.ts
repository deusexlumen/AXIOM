import { takeValue } from "@/cli/bin-helpers.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { Vision } from "@/cli/schemas/vision.js";
import { generatePlan } from "@/cli/commands/plan-generate.js";
import { writeOrderFile, readOrderFiles, moveToBlocked } from "@/cli/commands/plan-fs.js";
import { deepMerge } from "@/cli/commands/plan-merge.js";
import {
  loadVision,
  parseDelta,
  upsertVision,
  countOrders,
  preserveActiveState,
  PlanOptions,
} from "@/cli/commands/plan-common.js";

export async function runReplan(args: string[], options: PlanOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const { value: deltaRaw } = takeValue(args, "--delta");
  const { value: visionId } = takeValue(args, "--vision");
  if (!deltaRaw) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --delta <text|json>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const context = await readContext(cwd);
  const visions = context.visions ?? [];
  const targetId = visionId ?? visions[0]?.visionId;
  if (!targetId) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", "No vision found to replan", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const existing = await readOrderFiles(cwd, "open");
  const existingMap = new Map(existing.filter((o) => o.visionId === targetId).map((o) => [o.orderId, o]));

  const vision = await loadVision(cwd, "VISION.axm.json");
  if (vision.visionId !== targetId) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", `VISION.axm.json does not match visionId ${targetId}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  deepMerge(vision as unknown as Record<string, unknown>, parseDelta(deltaRaw));
  const plan = generatePlan(Vision.parse(vision));
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
      visionId: targetId,
      orders: plan.orders.length,
      blockedIds,
      dagDepth: plan.dagDepth,
      criticalPath: plan.criticalPath,
    },
    options.out
  );
}
