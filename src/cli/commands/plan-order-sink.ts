import { Vision } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { buildOrder, BUDGETS } from "@/cli/commands/plan-order-seed.js";

export function apiBuildOrder(vision: Vision, contractIds: string[]): WorkOrder {
  return buildOrder({
    vision,
    orderId: "ord_api_build",
    goal: "Regenerate API artifacts from contracts",
    dependsOn: contractIds,
    writeAllowed: ["api/generated/handler-types.ts", "api/generated/openapi.json", "src/generated/api-client.ts"],
    produces: {},
    tokenBudget: BUDGETS.apiBuild,
    gherkin: ["Handler types generated", "OpenAPI spec generated", "Typed client generated"],
    instruction: "Run axm api build to regenerate all API artifacts.",
  });
}

export function e2eOrder(vision: Vision, routeIds: string[]): WorkOrder {
  return buildOrder({
    vision,
    orderId: "ord_e2e",
    goal: "End-to-end tests for all routes",
    dependsOn: routeIds,
    writeAllowed: [`e2e/${vision.visionId}.spec.ts`],
    produces: {},
    tokenBudget: BUDGETS.e2e,
    gherkin: ["All routes have smoke tests", "Accessibility checks pass"],
    instruction: "Create e2e spec covering all routes and run with Playwright.",
  });
}
