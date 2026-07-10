import { STAGES } from "@/cli/commands/pipeline.js";
import type { AxiomConfig } from "@/cli/schemas/config.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { Stage } from "@/cli/pipeline/types.js";

export function selectStagesForHeal(config: AxiomConfig, latestPacket?: FixPacket): Stage[] {
  const e2eOn = config.pipeline.e2eOn;
  if (e2eOn === "always") return STAGES;
  if (e2eOn === "never") return STAGES.filter((s) => s.name !== "e2e");
  const target = latestPacket?.target?.file ?? "";
  const routeChange = target.startsWith("src/routes/") || target.startsWith("src\\routes\\");
  return routeChange ? STAGES : STAGES.filter((s) => s.name !== "e2e");
}
