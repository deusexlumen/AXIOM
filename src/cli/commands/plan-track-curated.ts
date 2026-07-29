import type { BriefJson } from "@/cli/schemas/brief.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { selectPresetForBrief } from "@/cli/presets/catalog.js";
import { baseOrder } from "@/cli/commands/plan-track-orders.js";
import { buildTailOrders } from "@/cli/commands/plan-track-tail.js";

export function curatedOrders(planId: string, brief: BriefJson): WorkOrder[] {
  const preset = selectPresetForBrief(brief);
  const directionId = `direction-preset-${preset.directionId}`;
  const tokens = "tokens-build";
  const motion = "motion-build";
  const pattern = "pattern-composition";
  return [
    baseOrder(planId, {
      orderId: directionId,
      goal: `Select and freeze curated direction preset ${preset.directionId}`,
      scope: { writeAllowed: ["DIRECTION.axm.json"] },
      tokenBudget: 2000,
      acceptance: { gherkin: ["DIRECTION.axm.json matches selected preset", "Preset validates against Direction schema"] },
      agentInstruction: `Write DIRECTION.axm.json from preset ${preset.directionId}.`,
    }),
    baseOrder(planId, {
      orderId: tokens,
      goal: "Generate theme tokens from tokens.json and DIRECTION",
      dependsOn: [directionId],
      scope: { writeAllowed: ["src/generated/theme.css", "tokens.json"] },
      tokenBudget: 6000,
      acceptance: { gherkin: ["theme.css generated", "Token references are valid"] },
      agentInstruction: "Run atl tokens build.",
    }),
    baseOrder(planId, {
      orderId: motion,
      goal: "Generate motion system from MOTION.axm.json",
      dependsOn: [tokens],
      scope: { writeAllowed: ["src/generated/motion.ts", "MOTION.axm.json"] },
      tokenBudget: 4000,
      acceptance: { gherkin: ["motion.ts generated", "Easing curves match direction tempo"] },
      agentInstruction: "Run atl motion build.",
    }),
    baseOrder(planId, {
      orderId: pattern,
      goal: "Compose patterns into campaign page",
      dependsOn: [motion],
      scope: { writeAllowed: ["src/components/CampaignPage.tsx", "src/components/CampaignPage.spec.json", "src/components/CampaignPage.test.tsx"] },
      produces: { components: ["CampaignPage"] },
      tokenBudget: 10000,
      acceptance: { gherkin: ["CampaignPage renders", "Patterns composed from direction"] },
      agentInstruction: "Compose selected patterns into src/components/CampaignPage.tsx.",
    }),
    ...buildTailOrders({
      planId,
      motionFile: pattern,
      e2eSpecPath: "e2e/campaign.spec.ts",
      perfReportPath: "pipeline/reports/perf.json",
    }),
  ];
}
