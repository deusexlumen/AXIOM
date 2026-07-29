import { z } from "zod/v3";

const referenceSchema = z.object({
  url: z.string().url(),
  liked: z.array(z.string()),
  disliked: z.array(z.string()),
});

export const BriefJson = z.object({
  $schema: z.string().optional(),
  track: z.enum(["curated", "bespoke"]),
  brand: z.object({
    name: z.string(),
    oneLiner: z.string(),
    existingAssets: z.array(z.string()),
    voice: z.array(z.string()),
  }),
  audience: z.object({
    who: z.string(),
    device: z.enum(["desktop-first", "mobile-first", "balanced"]),
    attention: z.enum(["explorativ", "zielgerichtet"]),
  }),
  goal: z.object({
    primary: z.enum(["signup", "contact", "awareness", "portfolio"]),
    successMetric: z.string(),
  }),
  references: z.array(referenceSchema).min(2),
  mood: z.object({
    words: z.array(z.string()),
    antiWords: z.array(z.string()),
  }),
  content: z.object({
    sections: z.array(z.string()),
    assets: z.enum(["vorhanden", "zu-erzeugen", "gemischt"]),
  }),
  constraints: z.object({
    deadlineDays: z.number().int().positive(),
    mustHave: z.array(z.string()),
    verboten: z.array(z.string()),
  }),
  webglAppetite: z.number().int().min(0).max(3),
});

export type BriefJson = z.infer<typeof BriefJson>;
