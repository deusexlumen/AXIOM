import { Vision } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";

export const BUDGETS = {
  dbSchema: 6000,
  migration: 4000,
  contract: 8000,
  apiBuild: 10000,
  list: 8000,
  row: 6000,
  page: 10000,
  route: 4000,
  e2e: 8000,
};

export interface OrderSeed {
  vision: Vision;
  orderId: string;
  goal: string;
  dependsOn: string[];
  writeAllowed: string[];
  produces: { components?: string[]; endpoints?: string[]; routes?: string[] };
  tokenBudget: number;
  gherkin: string[];
  instruction: string;
}

export function buildOrder(seed: OrderSeed): WorkOrder {
  return {
    orderId: seed.orderId,
    visionId: seed.vision.visionId,
    goal: seed.goal,
    scope: { writeAllowed: seed.writeAllowed },
    dependsOn: seed.dependsOn,
    produces: seed.produces,
    acceptance: { pipelineScope: seed.orderId, gherkin: seed.gherkin },
    tokenBudget: seed.tokenBudget,
    leaseRequired: true,
    status: "OPEN",
    claimedBy: null,
    attempts: { current: 0, max: 2 },
    agentInstruction: seed.instruction,
  };
}
