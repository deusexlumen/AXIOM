import { auditCommand } from "@/cli/commands/audit.js";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { STAGES } from "@/cli/commands/pipeline.js";
import { dbMigrateDryRun, checkPreDeployVeto, runVercelDeploy } from "@/cli/commands/deploy-helpers.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";
import type { Stage, PipelineOptions, PipelineReport } from "@/cli/pipeline/types.js";

export interface DeployOptions {
  cwd?: string;
  out?: NodeJS.WritableStream;
  env?: "local" | "prod";
  prod?: boolean;
  audit?: () => Promise<void>;
  runPipelineFn?: (cwd: string, stages: Stage[], options?: PipelineOptions) => Promise<PipelineReport>;
  vercelDeployFn?: (cwd: string, prod: boolean) => string;
}

function stageExitCode(stage: string): ExitCode {
  if (stage === "typecheck") return ExitCode.TYPE_ERROR;
  if (stage === "unit" || stage === "e2e") return ExitCode.TEST_ERROR;
  return ExitCode.VALIDATION_ERROR;
}

export async function deployCommand(args: string[], options: DeployOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const prod = options.prod ?? args.includes("--prod");
  const env = options.env ?? parseEnv(args);
  const auditFn = options.audit ?? auditCommand;
  const pipelineFn = options.runPipelineFn ?? runPipeline;
  const vercelFn = options.vercelDeployFn ?? runVercelDeploy;

  await auditFn();

  const report = await pipelineFn(cwd, STAGES, { out: options.out });
  if (report.result === "RED") {
    throw new CliError(
      JSON.stringify(
        cliFixPacket("AXM-P001", `Pipeline stage ${report.failedStage ?? "unknown"} failed`, ["I-11"])
      ),
      stageExitCode(report.failedStage ?? "validate")
    );
  }

  await dbMigrateDryRun(cwd, env);

  if (await checkPreDeployVeto(cwd)) {
    result({ awaitingVeto: true }, options.out);
    return;
  }

  const url = vercelFn(cwd, prod);
  result({ ok: true, url }, options.out);
}

function parseEnv(args: string[]): "local" | "prod" {
  const { value } = takeValue(args, "--env");
  if (value === "local") return "local";
  return "prod";
}
