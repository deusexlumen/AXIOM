import { WorkOrder } from "@/cli/schemas/work-order.js";

export function baseOrder(
  planId: string,
  seed: Partial<WorkOrder> & { orderId: string; goal: string; scope: { writeAllowed: string[] }; agentInstruction: string }
): WorkOrder {
  return {
    orderId: seed.orderId,
    visionId: planId,
    goal: seed.goal,
    scope: seed.scope,
    dependsOn: seed.dependsOn ?? [],
    produces: seed.produces ?? {},
    acceptance: seed.acceptance ?? { gherkin: [] },
    tokenBudget: seed.tokenBudget ?? 6000,
    leaseRequired: true,
    status: "OPEN",
    claimedBy: null,
    attempts: { current: 0, max: 2 },
    agentInstruction: seed.agentInstruction,
  };
}
