import { Vision, VisionEntity } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { safeId } from "@/cli/commands/plan-helpers.js";
import { buildOrder, BUDGETS } from "@/cli/commands/plan-order-seed.js";

export function dbSchemaOrder(vision: Vision, entity: VisionEntity): WorkOrder {
  const name = safeId(entity.name);
  const lower = name.toLowerCase();
  return buildOrder({
    vision,
    orderId: `ord_db_schema_${name}`,
    goal: `Drizzle schema for ${entity.name}`,
    dependsOn: [],
    writeAllowed: [`db/schema/${lower}.ts`],
    produces: {},
    tokenBudget: BUDGETS.dbSchema,
    gherkin: [`Schema ${entity.name} matches declared fields`, `Foreign keys reference ref(...) targets`],
    instruction: `Create db/schema/${lower}.ts for ${entity.name}.`,
  });
}

export function migrationOrder(vision: Vision, entity: VisionEntity): WorkOrder {
  const name = safeId(entity.name);
  const lower = name.toLowerCase();
  return buildOrder({
    vision,
    orderId: `ord_migration_${name}`,
    goal: `Deterministic migration for ${entity.name}`,
    dependsOn: [`ord_db_schema_${name}`],
    writeAllowed: [`db/migrations/0001_${lower}.sql`],
    produces: {},
    tokenBudget: BUDGETS.migration,
    gherkin: [`Migration creates ${entity.name} table`, `Migration is hash-stable`],
    instruction: `Generate db/migrations/0001_${lower}.sql from the schema.`,
  });
}

export function contractOrder(vision: Vision, entity: VisionEntity): WorkOrder {
  const name = safeId(entity.name);
  const lower = name.toLowerCase();
  const endpoints = [`${lower}.list`, `${lower}.create`, `${lower}.update`, `${lower}.delete`];
  return buildOrder({
    vision,
    orderId: `ord_contract_${name}`,
    goal: `Contract for ${entity.name} CRUD`,
    dependsOn: [`ord_db_schema_${name}`, `ord_migration_${name}`],
    writeAllowed: [
      `api/contracts/${lower}.contract.ts`,
      `api/handlers/${lower}.list.ts`,
      `api/handlers/${lower}.create.ts`,
      `api/handlers/${lower}.update.ts`,
      `api/handlers/${lower}.delete.ts`,
    ],
    produces: { endpoints },
    tokenBudget: BUDGETS.contract,
    gherkin: endpoints.map((e) => `Contract defines ${e}`),
    instruction: `Create api/contracts/${lower}.contract.ts for ${entity.name}.`,
  });
}
