import { describe, it, expect } from "vitest";
import { generateTrackPlan } from "@/cli/commands/plan-generate-track.js";
import type { BriefJson } from "@/cli/schemas/brief.js";

function sampleBrief(track: "curated" | "bespoke", overrides: Partial<BriefJson> = {}): BriefJson {
  return {
    track,
    brand: { name: "Demo Studio", oneLiner: "Demo.", existingAssets: [], voice: ["bold"] },
    audience: { who: "creatives", device: "desktop-first", attention: "explorativ" },
    goal: { primary: "awareness", successMetric: "time on site" },
    references: [
      { url: "https://a.co", liked: ["typography"], disliked: ["clutter"] },
      { url: "https://b.co", liked: ["motion"], disliked: ["noise"] },
    ],
    mood: { words: ["experimental", "glitch"], antiWords: ["calm", "minimal"] },
    content: { sections: ["hero"], assets: "vorhanden" },
    constraints: { deadlineDays: 21, mustHave: ["hero"], verboten: ["popups"] },
    webglAppetite: 3,
    ...overrides,
  };
}

describe("generateTrackPlan", () => {
  it("returns curated track orders", () => {
    const plan = generateTrackPlan({ brief: sampleBrief("curated") });
    expect(plan.track).toBe("curated");
    const ids = plan.orders.map((o) => o.orderId);
    expect(ids).toContain("direction-preset-preset_chromatic_glitch");
    expect(ids).toContain("tokens-build");
    expect(ids).toContain("motion-build");
    expect(ids).toContain("pattern-composition");
    expect(ids).toContain("build");
    expect(ids).toContain("e2e");
    expect(ids).toContain("perf");
    expect(ids).toContain("critic");
    expect(plan.orders).toHaveLength(8);
    expect(plan.dagDepth).toBeGreaterThan(0);
    expect(plan.criticalPath.length).toBeGreaterThan(0);
  });

  it("returns bespoke track orders", () => {
    const plan = generateTrackPlan({ brief: sampleBrief("bespoke") });
    expect(plan.track).toBe("bespoke");
    const ids = plan.orders.map((o) => o.orderId);
    expect(ids).toContain("brief-review");
    expect(ids).toContain("direction-generate");
    expect(ids).toContain("operator-veto");
    expect(ids).toContain("tokens-build");
    expect(ids).toContain("motion-build");
    expect(ids).toContain("custom-components");
    expect(ids).toContain("build");
    expect(ids).toContain("e2e");
    expect(ids).toContain("perf");
    expect(ids).toContain("critic");
    expect(plan.orders).toHaveLength(10);
    expect(plan.dagDepth).toBeGreaterThan(0);
  });

  it("uses a plan id derived from brand name", () => {
    const plan = generateTrackPlan({ brief: sampleBrief("curated", { brand: { name: "Acme Co", oneLiner: "", existingAssets: [], voice: [] } }) });
    expect(plan.planId).toBe("brief_acme_co");
  });

  it("produces orders with valid dependencies", () => {
    const plan = generateTrackPlan({ brief: sampleBrief("curated") });
    const ids = new Set(plan.orders.map((o) => o.orderId));
    for (const order of plan.orders) {
      for (const dep of order.dependsOn) {
        expect(ids.has(dep)).toBe(true);
      }
    }
  });
});
