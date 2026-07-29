import { resolve } from "node:path";
import { runCriticStage, CRITIC_REPORT_PATH } from "@/cli/pipeline/stages/critic.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export interface CriticOptions {
  cwd?: string;
  route?: string;
  out?: NodeJS.WritableStream;
}

export async function criticCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub !== "run") {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown critic subcommand: ${sub ?? ""}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const { value: route } = takeValue(args.slice(1), "--route");
  await runCritic({ cwd: process.cwd(), route });
}

export async function runCritic(options: CriticOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const scope = options.route !== undefined ? [`route:${options.route}`] : undefined;
  await runCriticStage(cwd, scope);
  result({ ok: true, report: resolve(cwd, CRITIC_REPORT_PATH) }, options.out);
}
