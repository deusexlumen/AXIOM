import { describe, it, expect } from "vitest";
import { buildBrief, listMissingFields } from "@/cli/elicitation/interview.js";

const fullAnswers = {
  track: "bespoke" as const,
  "goal.primary": "contact" as const,
  "brand.name": "Acme",
  "brand.oneLiner": "We build things.",
  "audience.who": "Startups",
  "audience.device": "desktop-first" as const,
  references: [
    { url: "https://activetheory.net", liked: ["depth"], disliked: [] },
    { url: "https://dogstudio.co", liked: ["type"], disliked: ["load time"] },
  ],
  "mood.words": ["monolithic", "warm"],
  "content.sections": ["hero", "work", "contact"],
  webglAppetite: 2,
};

describe("buildBrief", () => {
  it("produces a valid BriefJson from full answers", () => {
    const brief = buildBrief(fullAnswers);
    expect(brief.track).toBe("bespoke");
    expect(brief.brand.name).toBe("Acme");
    expect(brief.references).toHaveLength(2);
    expect(brief.webglAppetite).toBe(2);
  });

  it("throws when fewer than 2 references are given", () => {
    expect(() => buildBrief({ ...fullAnswers, references: [] })).toThrow(/at least 2 reference URLs/);
  });
});

describe("listMissingFields", () => {
  it("lists required fields that are missing", () => {
    const missing = listMissingFields({ track: "bespoke" });
    expect(missing.length).toBeGreaterThan(0);
    expect(missing).toContain("brand.name");
  });

  it("returns empty when all required fields are present", () => {
    expect(listMissingFields(fullAnswers)).toHaveLength(0);
  });
});
