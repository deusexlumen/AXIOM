import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { takeValue, requireArg } from "@/cli/bin-helpers.js";
import { migrateGen } from "@/cli/commands/db-generate.js";
import { migrateApply } from "@/cli/commands/db-apply.js";
import { seed } from "@/cli/commands/db-seed.js";
import { requireActiveLease } from "@/cli/leases/scope.js";

export async function dbCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub === "migrate") return dbMigrate(args.slice(1));
  if (sub === "seed") return dbSeed(args);
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown db subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

async function dbMigrate(args: string[]): Promise<void> {
  const sub = args[0];
  const { value: agentId } = takeValue(args.slice(1), "--agent");
  if (sub === "gen") {
    if (agentId) await requireActiveLease(process.cwd(), agentId, ["db/migrations"]);
    return migrateGen();
  }
  if (sub === "apply") {
    const rest = args.slice(1);
    const { value: env, rest: afterEnv } = takeValue(rest, "--env");
    if (agentId) await requireActiveLease(process.cwd(), agentId, ["db/migrations"]);
    if (env && env !== "local" && env !== "prod") {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-V000", `--env must be local or prod, got ${env}`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    return migrateApply(env === "prod" ? "prod" : "local");
  }
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown db migrate subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

async function dbSeed(args: string[]): Promise<void> {
  const { value: fixture, rest } = takeValue(args, "--fixture");
  const { value: agentId } = takeValue(rest, "--agent");
  if (!fixture) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --fixture <path>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  if (agentId) await requireActiveLease(process.cwd(), agentId, [fixture]);
  await seed(requireArg(fixture, "--fixture <path>"));
}
