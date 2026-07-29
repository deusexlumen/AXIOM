import { Vision } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { safeId, safePath, topoSortEntities } from "@/cli/commands/plan-helpers.js";
import { dbSchemaOrder, migrationOrder, contractOrder } from "@/cli/commands/plan-order-db.js";
import { apiBuildOrder, e2eOrder } from "@/cli/commands/plan-order-sink.js";
import { listOrder, rowOrder, pageOrder, routeOrder } from "@/cli/commands/plan-order-ui.js";
import { checkBudgets, assertDisjointWriteScopes, computeCriticalPath } from "@/cli/commands/plan-analyze.js";

export interface GeneratedPlan {
  orders: WorkOrder[];
  dagDepth: number;
  criticalPath: string[];
  componentCount: number;
  endpointCount: number;
  tokenTotal: number;
}

const KIND_ORDER = [
  "ord_db_schema_",
  "ord_migration_",
  "ord_contract_",
  "ord_api_build",
  "ord_list_",
  "ord_row_",
  "ord_page_",
  "ord_route_",
  "ord_e2e",
];

export function generatePlan(vision: Vision): GeneratedPlan {
  const sorted = topoSortEntities(vision.entities);
  const orders: WorkOrder[] = [];

  for (const entity of sorted) {
    orders.push(dbSchemaOrder(vision, entity));
    orders.push(migrationOrder(vision, entity));
    orders.push(contractOrder(vision, entity));
  }

  const contractIds = sorted.map((e) => `ord_contract_${safeId(e.name)}`);
  orders.push(apiBuildOrder(vision, contractIds));

  for (const entity of sorted) {
    orders.push(listOrder(vision, entity));
    orders.push(rowOrder(vision, entity));
  }

  for (const route of vision.routes) orders.push(pageOrder(vision, route));
  for (const route of vision.routes) orders.push(routeOrder(vision, route));

  orders.push(e2eOrder(vision, vision.routes.map((r) => `ord_route_${safePath(r.path)}`)));

  const componentCount = vision.routes.length + vision.entities.length * 2;
  const endpointCount = vision.entities.length * 4;
  const tokenTotal = orders.reduce((sum, o) => sum + o.tokenBudget, 0);

  checkBudgets(vision, componentCount, endpointCount, tokenTotal);
  assertDisjointWriteScopes(orders);

  const { depth, path } = computeCriticalPath(orders);
  return { orders: sortOrders(orders), dagDepth: depth, criticalPath: path, componentCount, endpointCount, tokenTotal };
}

function sortOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.sort((a, b) => {
    const ai = KIND_ORDER.findIndex((p) => a.orderId.startsWith(p));
    const bi = KIND_ORDER.findIndex((p) => b.orderId.startsWith(p));
    if (ai !== bi) return ai - bi;
    return a.orderId.localeCompare(b.orderId);
  });
}
