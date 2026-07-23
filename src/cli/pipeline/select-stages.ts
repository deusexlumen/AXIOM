import { runValidateStage } from "@/cli/pipeline/stages/validate.js";
import { runContractStage } from "@/cli/pipeline/stages/contract.js";
import { runTypecheckStage } from "@/cli/pipeline/stages/typecheck.js";
import { runLintStage } from "@/cli/pipeline/stages/lint.js";
import { runBuildStage } from "@/cli/pipeline/stages/build.js";
import { runUnitStage } from "@/cli/pipeline/stages/unit.js";
import { runE2eStage } from "@/cli/pipeline/stages/e2e.js";
import { runPerfStage } from "@/cli/pipeline/stages/perf.js";
import { runCriticStage } from "@/cli/pipeline/stages/critic.js";
import type { Stage, StageName } from "@/cli/pipeline/types.js";
import type { AxiomConfig } from "@/cli/schemas/config.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export const STAGES: Stage[] = [
  { name: "validate", run: runValidateStage },
  { name: "contract", run: runContractStage },
  { name: "typecheck", run: runTypecheckStage },
  { name: "lint", run: runLintStage },
  { name: "build", run: runBuildStage },
  { name: "unit", run: runUnitStage },
  { name: "e2e", run: runE2eStage },
  { name: "perf", run: runPerfStage },
  { name: "critic", run: runCriticStage },
];

export function selectStagesForPipeline(config: AxiomConfig, scope?: string, stage?: StageName): Stage[] {
  const e2eOn = config.pipeline.e2eOn;
  if (e2eOn === "always") return STAGES;
  if (stage === "e2e" || stage === "perf" || stage === "critic") return STAGES;
  if (e2eOn === "never") return STAGES.filter((s) => s.name !== "e2e" && s.name !== "perf");
  const scopeIsRoute = scope !== undefined && (scope.startsWith("src/routes/") || scope.startsWith("routes/"));
  return scopeIsRoute ? STAGES : STAGES.filter((s) => s.name !== "e2e" && s.name !== "perf");
}

export function selectStagesForHeal(config: AxiomConfig, latestPacket?: FixPacket): Stage[] {
  const e2eOn = config.pipeline.e2eOn;
  if (e2eOn === "always") return STAGES;
  if (e2eOn === "never") return STAGES.filter((s) => s.name !== "e2e" && s.name !== "perf");
  const target = latestPacket?.target?.file ?? "";
  const routeChange = target.startsWith("src/routes/") || target.startsWith("src\\routes\\");
  return routeChange ? STAGES : STAGES.filter((s) => s.name !== "e2e" && s.name !== "perf");
}
