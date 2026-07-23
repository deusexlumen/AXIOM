import { z } from "zod/v3";

export const CriticFinding = z.object({
  rubric: z.enum([
    "directionalFidelity",
    "hierarchy",
    "typographicCraft",
    "motionCohesion",
    "detailDensity",
    "antiTemplate",
  ]),
  screenshot: z.string().nullable(),
  finding: z.string(),
});

export type CriticFinding = z.infer<typeof CriticFinding>;

export const HeuristicFinding = z.object({
  checkId: z.string(),
  rubric: CriticFinding.shape.rubric,
  severity: z.enum(["warning", "critical"]),
  message: z.string(),
  evidence: z
    .object({
      file: z.string(),
      excerpt: z.string(),
    })
    .optional(),
});

export type HeuristicFinding = z.infer<typeof HeuristicFinding>;

export const CriticReport = z.object({
  rubrics: z.object({
    directionalFidelity: z.number().min(1).max(5),
    hierarchy: z.number().min(1).max(5),
    typographicCraft: z.number().min(1).max(5),
    motionCohesion: z.number().min(1).max(5),
    detailDensity: z.number().min(1).max(5),
    antiTemplate: z.number().min(1).max(5),
  }),
  overall: z.number().min(1).max(5),
  findings: z.array(CriticFinding),
  heuristicFindings: z.array(HeuristicFinding),
  model: z.string(),
  timestamp: z.string().datetime(),
  route: z.string().optional(),
});

export type CriticReport = z.infer<typeof CriticReport>;
