import { describe, it, expect } from "vitest";
import { STAGES } from "@/cli/commands/pipeline.js";
import { selectStagesForHeal } from "@/cli/pipeline/select-stages.js";
import type { AxiomConfig } from "@/cli/schemas/config.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

function config(e2eOn: AxiomConfig["pipeline"]["e2eOn"]): AxiomConfig {
  return {
    budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
    pipeline: { stages: ["validate", "typecheck", "lint", "unit", "e2e"], e2eOn },
    context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    ci: { headlessHeal: { enabled: false } },
  };
}

function packet(target: string): FixPacket {
  return {
    packetId: "p1",
    runId: "r1",
    attempt: { current: 1, max: 3 },
    errorCode: "AXM-V001",
    stage: "validate",
    severity: "BLOCKING",
    target: { file: target },
    message: "fail",
    rawEvidence: {},
    probableCause: "x",
    fixHint: "y",
    invariantsAffected: ["I-01"],
    agentInstruction: "fix",
  };
}

const stageNames = () => STAGES.map((s) => s.name);

const withoutE2e = () => stageNames().filter((n) => n !== "e2e");

describe("selectStagesForHeal", () => {
  it('includes e2e when e2eOn is "always"', () => {
    expect(selectStagesForHeal(config("always"), packet("src/components/Box.tsx")).map((s) => s.name)).toEqual(
      stageNames()
    );
  });

  it('excludes e2e when e2eOn is "never"', () => {
    expect(selectStagesForHeal(config("never"), packet("src/routes/Home.tsx")).map((s) => s.name)).toEqual(
      withoutE2e()
    );
  });

  it('excludes e2e for "route-change" when target is not a route', () => {
    expect(selectStagesForHeal(config("route-change"), packet("src/components/Box.tsx")).map((s) => s.name)).toEqual(
      withoutE2e()
    );
  });

  it('includes e2e for "route-change" when target is under src/routes', () => {
    expect(selectStagesForHeal(config("route-change"), packet("src/routes/Home.tsx")).map((s) => s.name)).toEqual(
      stageNames()
    );
  });

  it('excludes e2e for "route-change" when no packet is available', () => {
    expect(selectStagesForHeal(config("route-change"), undefined).map((s) => s.name)).toEqual(withoutE2e());
  });
});
