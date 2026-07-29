import { takeValue } from "@/cli/bin-helpers.js";
import { readOrderFiles } from "@/cli/commands/plan-fs.js";
import { readAllOrders } from "@/cli/commands/order-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import type { WorkOrder } from "@/cli/schemas/work-order.js";

export async function conductCommand(args: string[]): Promise<void> {
  const { value: agentsRaw } = takeValue(args, "--agents");
  const n = Math.max(1, Number(agentsRaw ?? "1"));
  const cwd = process.cwd();
  const open = await readOrderFiles(cwd, "open");
  const all = await readAllOrders(cwd);
  const doneIds = new Set(all.filter((o) => o.status === "DONE").map((o) => o.orderId));
  const ready = open
    .filter((o) => o.status === "OPEN" && o.dependsOn.every((d) => doneIds.has(d)))
    .sort((a, b) => dagDepth(b, all) - dagDepth(a, all) || a.orderId.localeCompare(b.orderId));
  result({
    recommendations: ready.slice(0, n).map((o) => ({ orderId: o.orderId, priority: dagDepth(o, all) })),
  });
}

function dagDepth(order: WorkOrder, all: WorkOrder[]): number {
  const byId = new Map(all.map((o) => [o.orderId, o]));
  const memo = new Map<string, number>();
  function depth(id: string): number {
    if (memo.has(id)) return memo.get(id) ?? 0;
    const o = byId.get(id);
    if (!o || o.dependsOn.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const d = 1 + Math.max(...o.dependsOn.map(depth));
    memo.set(id, d);
    return d;
  }
  return depth(order.orderId);
}
