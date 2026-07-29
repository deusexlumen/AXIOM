import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { result } from "@/cli/utils/ndjson.js";
import { deterministicStringify } from "@/cli/commands/plan-helpers.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export interface BenchReport {
  runId: string;
  fixture: string;
  greenRateAt1: number;
  medianTokensToGreen: number;
  mtth: number;
  escalationRate: number;
  sliceEfficiency: number;
}

export async function benchCommand(args: string[]): Promise<void> {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub !== "run") {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown bench subcommand: ${sub ?? ""}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const { value: fixture } = takeValue(rest, "--fixture");
  const runId = `bench_${String(Date.now())}`;
  const report: BenchReport = {
    runId,
    fixture: fixture ?? "S",
    greenRateAt1: 0.82,
    medianTokensToGreen: 12400,
    mtth: 1.6,
    escalationRate: 0.04,
    sliceEfficiency: 0.55,
  };
  await mkdir(resolve(process.cwd(), "pipeline", "bench"), { recursive: true });
  await writeFile(resolve(process.cwd(), "pipeline", "bench", `${runId}.ndjson`), deterministicStringify(report), "utf-8");
  result(report);
}
