import { describe, it, expect } from "vitest";
import { STAGES, selectStagesForPipeline } from "@/cli/commands/pipeline.js";
import type { AxiomConfig } from "@/cli/schemas/config.js";
import type { StageName } from "@/cli/pipeline/types.js";

function config(e2eOn: AxiomConfig["pipeline"]["e2eOn"]): AxiomConfig {
  return {
    budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
    pipeline: { stages: ["validate", "typecheck", "lint", "unit", "e2e"], e2eOn },
    context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    ci: { headlessHeal: { enabled: false } },
  };
}

const stageNames = () => STAGES.map((s) => s.name);

const withoutE2e = () => stageNames().filter((n) => n !== "e2e");

describe("selectStagesForPipeline", () => {
  it('includes e2e when e2eOn is "always"', () => {
    expect(selectStagesForPipeline(config("always"), "src/components/Box.tsx").map((s) => s.name)).toEqual(stageNames());
  });

  it('excludes e2e when e2eOn is "never"', () => {
    expect(selectStagesForPipeline(config("never"), "src/routes/Home.tsx").map((s) => s.name)).toEqual(withoutE2e());
  });

  it('excludes e2e for "route-change" with a non-route scope', () => {
    expect(selectStagesForPipeline(config("route-change"), "src/components/Box.tsx").map((s) => s.name)).toEqual(
      withoutE2e()
    );
  });

  it('includes e2e for "route-change" with a route scope', () => {
    expect(selectStagesForPipeline(config("route-change"), "src/routes/Home.tsx").map((s) => s.name)).toEqual(
      stageNames()
    );
  });

  it('includes e2e when --stage e2e is explicitly requested', () => {
    expect(selectStagesForPipeline(config("never"), "src/components/Box.tsx", "e2e" as StageName).map((s) => s.name)).toEqual(
      stageNames()
    );
  });

  it('handles route scopes without src prefix', () => {
    expect(selectStagesForPipeline(config("route-change"), "routes/Home.tsx").map((s) => s.name)).toEqual(stageNames());
  });
});
