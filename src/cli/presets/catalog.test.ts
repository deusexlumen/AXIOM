import { describe, it, expect } from "vitest";
import { DirectionJson } from "@/cli/schemas/direction.js";
import { PRESETS, selectPresetForBrief, getPresetById } from "@/cli/presets/catalog.js";
import type { BriefJson } from "@/cli/schemas/brief.js";

function sampleBrief(overrides: Partial<BriefJson> = {}): BriefJson {
  return {
    track: "curated",
    brand: { name: "Demo", oneLiner: "Demo.", existingAssets: [], voice: [] },
    audience: { who: "everyone", device: "balanced", attention: "explorativ" },
    goal: { primary: "awareness", successMetric: "time on site" },
    references: [
      { url: "https://a.co", liked: [], disliked: [] },
      { url: "https://b.co", liked: [], disliked: [] },
    ],
    mood: { words: ["dark", "brutalist"], antiWords: ["playful", "fast"] },
    content: { sections: ["hero"], assets: "vorhanden" },
    constraints: { deadlineDays: 14, mustHave: [], verboten: [] },
    webglAppetite: 1,
    ...overrides,
  };
}

describe("catalog", () => {
  it("contains six presets grouped by tempo", () => {
    expect(PRESETS).toHaveLength(6);
    expect(PRESETS.filter((p) => p.motionPersonality.tempo === "slow")).toHaveLength(2);
    expect(PRESETS.filter((p) => p.motionPersonality.tempo === "mid")).toHaveLength(2);
    expect(PRESETS.filter((p) => p.motionPersonality.tempo === "fast")).toHaveLength(2);
  });

  it("validates every preset against the Direction schema", () => {
    for (const preset of PRESETS) {
      const parsed = DirectionJson.safeParse(preset);
      expect(parsed.success, `preset ${preset.directionId} invalid: ${parsed.error?.message}`).toBe(true);
    }
  });

  it("selectPresetForBrief returns a preset", () => {
    const preset = selectPresetForBrief(sampleBrief());
    expect(preset).toBeDefined();
    expect(PRESETS.map((p) => p.directionId)).toContain(preset.directionId);
  });

  it("selectPresetForBrief prefers matching mood and webgl appetite", () => {
    const glitch = selectPresetForBrief(
      sampleBrief({ mood: { words: ["experimental", "glitch"], antiWords: [] }, webglAppetite: 3 })
    );
    expect(glitch.directionId).toBe("preset_chromatic_glitch");
  });

  it("getPresetById returns the correct preset or undefined", () => {
    expect(getPresetById("preset_monolith")?.directionId).toBe("preset_monolith");
    expect(getPresetById("preset_unknown")).toBeUndefined();
  });
});
