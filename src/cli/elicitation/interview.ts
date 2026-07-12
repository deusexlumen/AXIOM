import type { BriefJson } from "@/cli/schemas/brief.js";
import { allQuestions } from "@/cli/elicitation/catalog.js";

export interface AnswerSet {
  track?: string;
  "goal.primary"?: string;
  "brand.name"?: string;
  "brand.oneLiner"?: string;
  "brand.existingAssets"?: string[];
  "brand.voice"?: string[];
  "audience.who"?: string;
  "audience.device"?: string;
  "audience.attention"?: string;
  references?: { url: string; liked: string[]; disliked: string[] }[];
  "mood.words"?: string[];
  "mood.antiWords"?: string[];
  "content.sections"?: string[];
  "content.assets"?: string;
  "constraints.deadlineDays"?: number;
  "constraints.mustHave"?: string[];
  "constraints.verboten"?: string[];
  webglAppetite?: number;
}

const DEFAULT_ANSWERS: Partial<AnswerSet> = {
  "audience.attention": "explorativ",
  "brand.existingAssets": [],
  "brand.voice": [],
  "mood.antiWords": [],
  "content.assets": "gemischt",
  "constraints.mustHave": [],
  "constraints.verboten": [],
  "constraints.deadlineDays": 14,
};

function pick<T>(value: T | undefined, fallback: T): T {
  return value ?? fallback;
}

export function buildBrief(answers: AnswerSet): BriefJson {
  const merged = { ...DEFAULT_ANSWERS, ...answers };
  const refs = pick(merged.references, []);
  if (refs.length < 2) {
    throw new Error("Elicitation requires at least 2 reference URLs.");
  }

  return {
    track: pick(merged.track as "curated" | "bespoke" | undefined, "bespoke"),
    brand: {
      name: pick(merged["brand.name"], ""),
      oneLiner: pick(merged["brand.oneLiner"], ""),
      existingAssets: pick(merged["brand.existingAssets"], []),
      voice: pick(merged["brand.voice"], []),
    },
    audience: {
      who: pick(merged["audience.who"], ""),
      device: pick(merged["audience.device"] as "desktop-first" | "mobile-first" | "balanced" | undefined, "balanced"),
      attention: pick(merged["audience.attention"] as "explorativ" | "zielgerichtet" | undefined, "explorativ"),
    },
    goal: {
      primary: pick(merged["goal.primary"] as "signup" | "contact" | "awareness" | "portfolio" | undefined, "awareness"),
      successMetric: "TBD by operator",
    },
    references: refs,
    mood: {
      words: pick(merged["mood.words"], []),
      antiWords: pick(merged["mood.antiWords"], []),
    },
    content: {
      sections: pick(merged["content.sections"], []),
      assets: pick(merged["content.assets"] as "vorhanden" | "zu-erzeugen" | "gemischt" | undefined, "gemischt"),
    },
    constraints: {
      deadlineDays: pick(merged["constraints.deadlineDays"], 14),
      mustHave: pick(merged["constraints.mustHave"], []),
      verboten: pick(merged["constraints.verboten"], []),
    },
    webglAppetite: pick(merged.webglAppetite, 0),
  };
}

export function listMissingFields(answers: AnswerSet): string[] {
  const missing: string[] = [];
  for (const question of allQuestions()) {
    const value = answers[question.field as keyof AnswerSet];
    if (question.required && (value === undefined || (Array.isArray(value) && value.length === 0))) {
      missing.push(question.field);
    }
  }
  return missing;
}
