import { Vision } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export function checkBudgets(vision: Vision, components: number, endpoints: number, tokens: number): void {
  const b = vision.budgets;
  if (components > b.maxComponents || endpoints > b.maxEndpoints || tokens > b.tokenCeilingTotal) {
    throw new CliError(
      JSON.stringify(
        cliFixPacket(
          "AXM-P003",
          `Budget ceiling exceeded: components=${components}/${b.maxComponents}, endpoints=${endpoints}/${b.maxEndpoints}, tokens=${tokens}/${b.tokenCeilingTotal}`,
          ["I-01", "I-02"]
        )
      ),
      ExitCode.BUDGET_ERROR
    );
  }
}

export function assertDisjointWriteScopes(orders: WorkOrder[]): void {
  const seen = new Set<string>();
  for (const order of orders) {
    for (const file of order.scope.writeAllowed) {
      if (seen.has(file)) {
        throw new CliError(
          JSON.stringify(cliFixPacket("AXM-P002", `Overlapping write scope: ${file}`, ["I-17"])),
          ExitCode.VALIDATION_ERROR
        );
      }
      seen.add(file);
    }
  }
}

export function computeCriticalPath(orders: WorkOrder[]): { depth: number; path: string[] } {
  const byId = new Map(orders.map((o) => [o.orderId, o]));
  const distance = new Map<string, number>();

  for (const order of orders) {
    let max = 0;
    for (const dep of order.dependsOn) max = Math.max(max, (distance.get(dep) ?? 0) + 1);
    distance.set(order.orderId, max);
  }

  let depth = 0;
  let sink = "";
  for (const [id, d] of distance) {
    if (d > depth || (d === depth && (sink === "" || id.localeCompare(sink) < 0))) {
      depth = d;
      sink = id;
    }
  }

  const path: string[] = [];
  let current = sink;
  while (current) {
    path.unshift(current);
    const order = byId.get(current);
    if (!order || order.dependsOn.length === 0) break;
    const parent = order.dependsOn
      .map((id) => ({ id, d: distance.get(id) ?? 0 }))
      .sort((a, b) => b.d - a.d || a.id.localeCompare(b.id))[0];
    if (!parent) break;
    current = parent.id;
  }

  return { depth, path };
}
