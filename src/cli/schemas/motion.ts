import { z } from "zod";

const easeItemSchema = z.object({
  curve: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  meaning: z.string(),
});

const transitionSchema = z.object({
  grammar: z.string(),
  dur: z.union([z.number(), z.string()]),
  ease: z.string(),
});

export const MotionJson = z.object({
  ease: z.record(z.string(), easeItemSchema),
  dur: z.record(z.string(), z.number()),
  stagger: z.record(z.string(), z.number()),
  scroll: z.object({
    lenis: z.object({ lerp: z.number() }),
    scrubDefault: z.number(),
    pinSpacing: z.boolean(),
  }),
  transitions: z.record(z.string(), transitionSchema),
  choreography: z.object({
    revealOrder: z.array(z.string()),
    maxConcurrentTimelines: z.number(),
  }),
  reducedMotion: z.object({
    strategy: z.string(),
    durFactor: z.number(),
  }),
});

export type MotionJson = z.infer<typeof MotionJson>;
