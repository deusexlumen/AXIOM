import { z } from "zod/v3";

const variableAxisSchema = z.record(z.string(), z.array(z.number()).min(2).max(2));

const typographyRoleSchema = z.object({
  family: z.string(),
  axis: variableAxisSchema.optional(),
  case: z.enum(["mixed", "upper", "lower", "capitalize"]).optional(),
});

const colorStorySchema = z.object({
  story: z.string(),
  tokensDraft: z.record(z.string(), z.string()),
});

const spaceLanguageSchema = z.object({
  language: z.enum(["airy", "dense", "compact", "expansive"]),
  density: z.number().min(0).max(1),
  gridBias: z.enum(["symmetric", "asymmetric", "broken"]),
});

const motionPersonalitySchema = z.object({
  adjectives: z.array(z.string()).min(1).max(5),
  tempo: z.enum(["slow", "mid", "fast"]),
  playfulness: z.number().min(0).max(1),
});

const textureSchema = z.object({
  grain: z.number().min(0).max(1),
  noiseShader: z.boolean(),
});

export const DirectionJson = z.object({
  directionId: z.string(),
  thesis: z.string(),
  typography: z.object({
    display: typographyRoleSchema,
    text: typographyRoleSchema,
    scaleRatio: z.number().min(1).max(2),
  }),
  color: colorStorySchema,
  space: spaceLanguageSchema,
  motionPersonality: motionPersonalitySchema,
  texture: textureSchema,
  webglLevel: z.number().int().min(0).max(3),
  sceneIdeas: z.array(z.string()).min(1),
});

export type DirectionJson = z.infer<typeof DirectionJson>;
