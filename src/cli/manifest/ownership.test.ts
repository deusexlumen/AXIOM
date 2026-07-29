import { describe, it, expect } from "vitest";
import { determineOwnershipZones } from "./ownership.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const baseContext: AgentContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
};

function component(overrides: Partial<AgentContext["components"][number]>): AgentContext["components"][number] {
  return {
    name: "C",
    file: "src/components/C.tsx",
    spec: "src/components/C.spec.json",
    test: "src/components/C.test.tsx",
    exports: ["C"],
    dependsOn: [],
    usedBy: [],
    loc: 10,
    bytes: 100,
    status: "GREEN",
    specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    lastPipelineRun: "2026-07-08T00:00:00Z",
    ...overrides,
  };
}

describe("determineOwnershipZones", () => {
  it("flags a component placed in a LOCKED zone", () => {
    const context: AgentContext = {
      ...baseContext,
      integrity: { lockedFiles: { "src/core/router.ts": "sha256:aaa" }, machineFiles: {} },
      components: [component({ name: "Bad", file: "src/core/router.ts", spec: "src/core/router.spec.json", test: "src/core/router.test.tsx", exports: ["Bad"] })],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual({ file: "src/core/router.ts", zone: "LOCKED" });
  });

  it("allows AGENT-zone components", () => {
    const context: AgentContext = {
      ...baseContext,
      components: [component({ name: "Good", file: "src/components/Good.tsx" })],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(0);
  });

  it("allows MACHINE-zone components", () => {
    const context: AgentContext = {
      ...baseContext,
      components: [component({ name: "Route", file: "src/routes/home.route.tsx", spec: "src/routes/home.route.spec.json", test: "src/routes/home.route.test.tsx" })],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(0);
  });

  it("allows top-level src files as AGENT zone", () => {
    const context: AgentContext = {
      ...baseContext,
      components: [component({ name: "App", file: "src/App.tsx", spec: "src/App.spec.json", test: "src/App.test.tsx" })],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(0);
  });
});
