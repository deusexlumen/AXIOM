import { WorkOrder } from "@/cli/schemas/work-order.js";
import { baseOrder } from "@/cli/commands/plan-track-orders.js";

export interface TailOptions {
  planId: string;
  motionFile: string;
  e2eSpecPath: string;
  perfReportPath: string;
}

export function buildTailOrders({ planId, motionFile, e2eSpecPath, perfReportPath }: TailOptions): WorkOrder[] {
  const build = "build";
  const e2e = "e2e";
  const perf = "perf";
  return [
    baseOrder(planId, {
      orderId: build,
      goal: "Static build",
      dependsOn: [motionFile],
      scope: { writeAllowed: ["out/", "next.config.ts", "package.json"] },
      tokenBudget: 8000,
      acceptance: { gherkin: ["pnpm build ok", "out/ exists"] },
      agentInstruction: "Run pnpm build.",
    }),
    baseOrder(planId, {
      orderId: e2e,
      goal: "E2E tests",
      dependsOn: [build],
      scope: { writeAllowed: [e2eSpecPath] },
      tokenBudget: 6000,
      acceptance: { gherkin: ["E2E pass", "a11y ok"] },
      agentInstruction: "Create e2e spec and run Playwright.",
    }),
    baseOrder(planId, {
      orderId: perf,
      goal: "Perf budget",
      dependsOn: [build],
      scope: { writeAllowed: ["perf/home.perf.json", perfReportPath] },
      tokenBudget: 6000,
      acceptance: { gherkin: ["Budget met", "Scores recorded"] },
      agentInstruction: "Run perf tests.",
    }),
    baseOrder(planId, {
      orderId: "critic",
      goal: "CRITIC review",
      dependsOn: [e2e, perf],
      scope: { writeAllowed: ["pipeline/reports/critic.json"] },
      tokenBudget: 6000,
      acceptance: { gherkin: ["CRITIC report", "directionalFidelity >= 4"] },
      agentInstruction: "Run CRITIC.",
    }),
  ];
}
