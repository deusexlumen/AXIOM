import { z } from "zod/v3";

const easeItemSchema = z.object({
  curve: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  meaning: z.string(),
});

const transitionSchema = z.object({
  grammar: z.string(),
  dur: z.string(),
  ease: z.string(),
});

export const MotionJson = z
  .object({
    ease: z.record(z.string(), easeItemSchema),
    dur: z.object({ max: z.number() }).catchall(z.number()),
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
  })
  .superRefine((data, ctx) => {
    const max = data.dur.max;
    if (max !== undefined) {
      for (const [key, value] of Object.entries(data.dur)) {
        if (value > max) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dur", key],
            message: `dur.${key} (${value}) exceeds dur.max (${max})`,
          });
        }
      }
    }
    for (const [key, item] of Object.entries(data.transitions)) {
      if (data.dur[item.dur] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transitions", key, "dur"],
          message: `transition "${key}" references unknown dur token "${item.dur}"`,
        });
      }
      if (data.ease[item.ease] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transitions", key, "ease"],
          message: `transition "${key}" references unknown ease token "${item.ease}"`,
        });
      }
    }
  });

export type MotionJson = z.infer<typeof MotionJson>;
