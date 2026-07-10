import { resolve } from "node:path";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { STAGES, selectStagesForPipeline } from "@/cli/pipeline/select-stages.js";
import type { StageName } from "@/cli/pipeline/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { loadConfig } from "@/cli/heal/config.js";

export { STAGES, selectStagesForPipeline };

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
  const config = await loadConfig(cwd);
  const stages = selectStagesForPipeline(config, scope, stage);
  await runPipeline(cwd, stages, { scope, stage });
}
