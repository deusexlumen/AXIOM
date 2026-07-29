import { WorkOrder } from "@/cli/schemas/work-order.js";
import { baseOrder } from "@/cli/commands/plan-track-orders.js";
import { buildTailOrders } from "@/cli/commands/plan-track-tail.js";

export function bespokeOrders(planId: string): WorkOrder[] {
  const review = "brief-review";
  const generate = "direction-generate";
  const veto = "operator-veto";
  const tokens = "tokens-build";
  const motion = "motion-build";
  const custom = "custom-components";
  const front: WorkOrder[] = [
    baseOrder(planId, {
      orderId: review,
      goal: "Review BRIEF",
      scope: { writeAllowed: ["BRIEF.axm.json"] },
      tokenBudget: 2000,
      acceptance: { gherkin: ["BRIEF valid", "References parseable"] },
      agentInstruction: "Validate BRIEF.",
    }),
    baseOrder(planId, {
      orderId: generate,
      goal: "Generate 3 bespoke directions",
      dependsOn: [review],
      scope: { writeAllowed: ["DIRECTION_A.axm.json", "DIRECTION_B.axm.json", "DIRECTION_C.axm.json"] },
      tokenBudget: 8000,
      acceptance: { gherkin: ["3 candidates generated", "Reference brief mood"] },
      agentInstruction: "Run atl direct generate.",
    }),
    baseOrder(planId, {
      orderId: veto,
      goal: "Operator veto / freeze",
      dependsOn: [generate],
      scope: { writeAllowed: ["DIRECTION.axm.json"] },
      tokenBudget: 2000,
      acceptance: { gherkin: ["One direction chosen", "DIRECTION.axm.json frozen"] },
      agentInstruction: "Run atl direct choose <id>.",
    }),
    baseOrder(planId, {
      orderId: tokens,
      goal: "Tokens build",
      dependsOn: [veto],
      scope: { writeAllowed: ["src/generated/theme.css", "tokens.json"] },
      tokenBudget: 6000,
      acceptance: { gherkin: ["theme.css generated", "Tokens valid"] },
      agentInstruction: "Run atl tokens build.",
    }),
    baseOrder(planId, {
      orderId: motion,
      goal: "Motion build",
      dependsOn: [tokens],
      scope: { writeAllowed: ["src/generated/motion.ts", "MOTION.axm.json"] },
      tokenBudget: 4000,
      acceptance: { gherkin: ["motion.ts generated", "Easing matches tempo"] },
      agentInstruction: "Run atl motion build.",
    }),
    baseOrder(planId, {
      orderId: custom,
      goal: "Custom components",
      dependsOn: [motion],
      scope: { writeAllowed: ["src/components/CustomPage.tsx", "src/components/CustomPage.spec.json", "src/components/CustomPage.test.tsx"] },
      produces: { components: ["CustomPage"] },
      tokenBudget: 12000,
      acceptance: { gherkin: ["CustomPage renders", "Matches direction"] },
      agentInstruction: "Build bespoke components.",
    }),
  ];
  return [
    ...front,
    ...buildTailOrders({
      planId,
      motionFile: custom,
      e2eSpecPath: "e2e/bespoke.spec.ts",
      perfReportPath: "pipeline/reports/perf.json",
    }),
  ];
}
