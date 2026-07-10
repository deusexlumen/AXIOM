import { z } from "zod/v3";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { ModelPatch } from "@/cli/heal/types.js";

const ModelResponse = z.object({
  patches: z.array(z.object({ file: z.string(), content: z.string() })).optional(),
});

export async function callModel(endpoint: string, packet: FixPacket, fetchImpl: typeof fetch): Promise<ModelPatch[]> {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packet }),
  });
  if (!response.ok) {
    throw new Error(`Model endpoint returned ${response.status}`);
  }
  const data = (await response.json()) as unknown;
  const parsed = ModelResponse.parse(data);
  return parsed.patches ?? [];
}
