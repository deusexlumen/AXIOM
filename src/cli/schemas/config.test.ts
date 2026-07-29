import { describe, it, expect } from "vitest";
import { AxiomConfig } from "@/cli/schemas/config.js";

describe("AxiomConfig schema", () => {
  it("defaults e2eOn to route-change when omitted", () => {
    const raw = {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: { stages: ["validate", "unit"] },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    };
    const parsed = AxiomConfig.parse(raw);
    expect(parsed.pipeline.e2eOn).toBe("route-change");
  });

  it("accepts all e2eOn values", () => {
    for (const e2eOn of ["never", "route-change", "always"] as const) {
      const raw = {
        budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
        pipeline: { stages: ["validate", "unit"], e2eOn },
        context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
      };
      expect(AxiomConfig.parse(raw).pipeline.e2eOn).toBe(e2eOn);
    }
  });

  it("rejects invalid e2eOn values", () => {
    const raw = {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: { stages: ["validate", "unit"], e2eOn: "sometimes" },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    };
    expect(AxiomConfig.safeParse(raw).success).toBe(false);
  });

  it("defaults ci.headlessHeal.enabled to false when ci is omitted", () => {
    const raw = {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: { stages: ["validate", "unit"] },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    };
    const parsed = AxiomConfig.parse(raw);
    expect(parsed.ci.headlessHeal.enabled).toBe(false);
  });
});
