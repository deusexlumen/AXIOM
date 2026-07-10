import { resolve } from "node:path";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { runValidateStage } from "@/cli/pipeline/stages/validate.js";
import { runContractStage } from "@/cli/pipeline/stages/contract.js";
import { runTypecheckStage } from "@/cli/pipeline/stages/typecheck.js";
import { runLintStage } from "@/cli/pipeline/stages/lint.js";
import { runUnitStage } from "@/cli/pipeline/stages/unit.js";
import { runE2eStage } from "@/cli/pipeline/stages/e2e.js";
import type { Stage, StageName } from "@/cli/pipeline/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export const STAGES: Stage[] = [
  { name: "validate", run: runValidateStage },
  { name: "contract", run: runContractStage },
  { name: "typecheck", run: runTypecheckStage },
  { name: "lint", run: runLintStage },
  { name: "unit", run: runUnitStage },
  { name: "e2e", run: runE2eStage },
];

export async function pipelineCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub !== "run") {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown pipeline subcommand: ${sub ?? ""}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const rest = args.slice(1);
  const cwdArg = rest[0]?.startsWith("--") ? "." : (rest[0] ?? ".");
  const cwd = resolve(process.cwd(), cwdArg);
  const scopeIdx = rest.indexOf("--scope");
  const scope = scopeIdx >= 0 ? rest[scopeIdx + 1] : undefined;
  const stageIdx = rest.indexOf("--stage");
  const stage = stageIdx >= 0 ? (rest[stageIdx + 1] as StageName) : undefined;
  if (stage !== undefined && !STAGES.some((s) => s.name === stage)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown stage: ${stage}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  await runPipeline(cwd, STAGES, { scope, stage });
}
