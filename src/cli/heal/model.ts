import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { ModelPatch } from "@/cli/heal/types.js";

export async function callModel(endpoint: string, packet: FixPacket, fetchImpl: typeof fetch): Promise<ModelPatch[]> {
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packet }),
  });
  if (!response.ok) {
    throw new Error(`Model endpoint returned ${response.status}`);
  }
  const data = (await response.json()) as { patches?: unknown[] };
  const patches: ModelPatch[] = [];
  if (!Array.isArray(data.patches)) return patches;
  for (const patch of data.patches) {
    if (typeof patch !== "object" || patch === null) continue;
    const record = patch as Record<string, unknown>;
    if (typeof record.file === "string" && typeof record.content === "string") {
      patches.push({ file: record.file, content: record.content });
    }
  }
  return patches;
}
