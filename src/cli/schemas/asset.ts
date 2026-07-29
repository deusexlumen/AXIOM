import { z } from "zod/v3";

export const AssetEntry = z.object({
  type: z.enum(["font", "image", "model"]),
  name: z.string(),
  src: z.string(),
  textureMB: z.number().optional(),
  budgetMB: z.number().optional(),
});
export type AssetEntry = z.infer<typeof AssetEntry>;
