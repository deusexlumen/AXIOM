import { z } from "zod/v3";
import { zodToJsonSchema } from "zod-to-json-schema";

export const PropType = z.enum(["string", "number", "boolean", "enum", "function"]);

export const PropSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    required: z.boolean().default(false),
    constraints: z.object({ minLength: z.number().optional(), maxLength: z.number().optional() }).optional(),
  }),
  z.object({
    type: z.literal("number"),
    required: z.boolean().default(false),
    constraints: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  }),
  z.object({
    type: z.literal("boolean"),
    required: z.boolean().default(false),
    default: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("enum"),
    required: z.boolean().default(false),
    values: z.array(z.string()).min(1),
    default: z.string().optional(),
  }),
  z.object({
    type: z.literal("function"),
    required: z.boolean().default(false),
    signature: z.string(),
  }),
]);

export const ComponentSpec = z.object({
  $schema: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  props: z.record(z.string(), PropSchema).default({}),
  states: z.array(z.string()).default([]),
  a11y: z.object({
    role: z.string(),
    focusable: z.boolean(),
    minTouchTarget: z.string().optional(),
    requiredAria: z.array(z.string()).default([]),
  }),
  tokensUsed: z.array(z.string()).default([]),
  forbidden: z.array(z.string()).default([]),
});

export type ComponentSpec = z.infer<typeof ComponentSpec>;

export const ComponentSpecJsonSchema = zodToJsonSchema(ComponentSpec, { name: "component-spec" });
