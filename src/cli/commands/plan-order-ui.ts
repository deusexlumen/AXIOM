import { Vision, VisionEntity, VisionRoute } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { safeId, safePath } from "@/cli/commands/plan-helpers.js";
import { buildOrder, BUDGETS } from "@/cli/commands/plan-order-seed.js";

export function listOrder(vision: Vision, entity: VisionEntity): WorkOrder {
  const name = safeId(entity.name);
  return buildOrder({
    vision,
    orderId: `ord_list_${name}`,
    goal: `${entity.name} list component`,
    dependsOn: ["ord_api_build"],
    writeAllowed: [`src/components/${entity.name}List.tsx`, `src/components/${entity.name}List.spec.json`],
    produces: { components: [`${entity.name}List`] },
    tokenBudget: BUDGETS.list,
    gherkin: [`Renders a list of ${entity.name} rows`, `Uses the generated API client`],
    instruction: `Create ${entity.name}List component and sidecar.`,
  });
}

export function rowOrder(vision: Vision, entity: VisionEntity): WorkOrder {
  const name = safeId(entity.name);
  return buildOrder({
    vision,
    orderId: `ord_row_${name}`,
    goal: `${entity.name} row component`,
    dependsOn: ["ord_api_build"],
    writeAllowed: [`src/components/${entity.name}Row.tsx`, `src/components/${entity.name}Row.spec.json`],
    produces: { components: [`${entity.name}Row`] },
    tokenBudget: BUDGETS.row,
    gherkin: [`Renders a single ${entity.name}`, `Actions call the API client`],
    instruction: `Create ${entity.name}Row component and sidecar.`,
  });
}

export function pageOrder(vision: Vision, route: VisionRoute): WorkOrder {
  const safe = safePath(route.path);
  const pageName = `Page${safe}`;
  return buildOrder({
    vision,
    orderId: `ord_page_${safe}`,
    goal: `Page component for ${route.path}: ${route.purpose}`,
    dependsOn: ["ord_api_build"],
    writeAllowed: [`src/components/${pageName}.tsx`, `src/components/${pageName}.spec.json`],
    produces: { components: [pageName] },
    tokenBudget: BUDGETS.page,
    gherkin: [`Page renders for route ${route.path}`, `Uses data-axm-id="${pageName}"`],
    instruction: `Create ${pageName} component and sidecar for ${route.path}.`,
  });
}

export function routeOrder(vision: Vision, route: VisionRoute): WorkOrder {
  const safe = safePath(route.path);
  const pageName = `Page${safe}`;
  return buildOrder({
    vision,
    orderId: `ord_route_${safe}`,
    goal: `Route wiring for ${route.path}`,
    dependsOn: [`ord_page_${safe}`],
    writeAllowed: [`src/routes/${safe}.route.tsx`],
    produces: { routes: [route.path] },
    tokenBudget: BUDGETS.route,
    gherkin: [`Route ${route.path} is registered`, `Mounts ${pageName}`],
    instruction: `Create src/routes/${safe}.tsx for ${route.path}.`,
  });
}
