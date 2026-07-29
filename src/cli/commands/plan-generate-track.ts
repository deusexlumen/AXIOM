import type { BriefJson } from "@/cli/schemas/brief.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { safeId } from "@/cli/commands/plan-helpers.js";
import { assertDisjointWriteScopes, computeCriticalPath } from "@/cli/commands/plan-analyze.js";
import { curatedOrders } from "@/cli/commands/plan-track-curated.js";
import { bespokeOrders } from "@/cli/commands/plan-track-bespoke.js";

export interface TrackPlan {
  planId: string;
  track: "curated" | "bespoke";
  orders: WorkOrder[];
  dagDepth: number;
  criticalPath: string[];
}

export function generateTrackPlan({ brief }: { brief: BriefJson }): TrackPlan {
  const planId = `brief_${safeId(brief.brand.name).toLowerCase()}`;
  const orders = brief.track === "curated" ? curatedOrders(planId, brief) : bespokeOrders(planId);
  assertDisjointWriteScopes(orders);
  const { depth, path } = computeCriticalPath(orders);
  return { planId, track: brief.track, orders, dagDepth: depth, criticalPath: path };
}
