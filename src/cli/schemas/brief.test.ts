import { describe, it, expect } from "vitest";
import { BriefJson } from "@/cli/schemas/brief.js";

const validBrief = {
  track: "bespoke",
  brand: {
    name: "Acme",
    oneLiner: "We build things.",
    existingAssets: ["logo.svg"],
    voice: ["präzise", "kompromisslos"],
  },
  audience: {
    who: "Design-led startups",
    device: "desktop-first",
    attention: "explorativ",
  },
  goal: {
    primary: "contact",
    successMetric: "Qualified leads via contact form",
  },
  references: [
    { url: "https://activetheory.net", liked: ["Szenen-Tiefe"], disliked: [] },
    { url: "https://dogstudio.co", liked: ["Typo-Mut"], disliked: ["Ladezeit"] },
  ],
  mood: {
    words: ["monolithisch", "warm"],
    antiWords: ["verspielt"],
  },
  content: {
    sections: ["hero", "work", "about", "contact"],
    assets: "gemischt",
  },
  constraints: {
    deadlineDays: 14,
    mustHave: [],
    verboten: ["Stock-Fotos"],
  },
  webglAppetite: 2,
};

describe("BriefJson schema", () => {
  it("accepts a valid brief", () => {
    expect(() => BriefJson.parse(validBrief)).not.toThrow();
  });

  it("rejects fewer than 2 references", () => {
    const bad = { ...validBrief, references: [validBrief.references[0]] };
    expect(() => BriefJson.parse(bad)).toThrow();
  });

  it("rejects webglAppetite out of range", () => {
    const bad = { ...validBrief, webglAppetite: 4 };
    expect(() => BriefJson.parse(bad)).toThrow();
  });

  it("rejects invalid track", () => {
    const bad = { ...validBrief, track: "unknown" };
    expect(() => BriefJson.parse(bad)).toThrow();
  });
});
