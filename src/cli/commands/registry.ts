import { ExitCode } from "@/cli/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { takeValue, requireArg } from "@/cli/bin-helpers.js";
import { init } from "@/cli/commands/init.js";
import { validateCommand } from "@/cli/commands/validate.js";
import { pipelineCommand } from "@/cli/commands/pipeline.js";
import { healCommand } from "@/cli/commands/heal.js";
import { runAddCommand } from "@/cli/bin-commands.js";
import { tokensBuild } from "@/cli/commands/tokens-build.js";
import { apiCommand } from "@/cli/commands/api.js";
import { dbCommand } from "@/cli/commands/db.js";
import { contextSliceCommand } from "@/cli/commands/context.js";
import { splitCommand } from "@/cli/commands/split.js";
import { planCommand } from "@/cli/commands/plan.js";
import { orderCommand } from "@/cli/commands/order.js";
import { leaseCommand } from "@/cli/commands/lease.js";
import { conductCommand } from "@/cli/commands/conduct.js";
import { ledgerCommand } from "@/cli/commands/ledger.js";
import { benchCommand } from "@/cli/commands/bench.js";
import { auditCommand } from "@/cli/commands/audit.js";

type Handler = (args: string[]) => Promise<number>;

function unknownSubcommand(command: string, sub: string | undefined): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown ${command} subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

function wrap(voidFn: (args: string[]) => Promise<void>): Handler {
  return async (args) => {
    await voidFn(args);
    return ExitCode.OK;
  };
}

async function initHandler(args: string[]): Promise<number> {
  await init(requireArg(args[0], "<name>"), { skipInstall: args.includes("--skip-install") });
  return ExitCode.OK;
}

async function healHandler(args: string[]): Promise<number> {
  const sub = args[0];
  if (sub !== "--auto") unknownSubcommand("heal", sub);
  const { value: maxRetries } = takeValue(args.slice(1), "--max-retries");
  await healCommand({ maxRetries: maxRetries ? Number(maxRetries) : undefined });
  return ExitCode.OK;
}

async function tokensHandler(args: string[]): Promise<number> {
  const sub = args[0];
  if (sub === "build") {
    await tokensBuild(process.cwd());
    return ExitCode.OK;
  }
  unknownSubcommand("tokens", sub);
}

async function contextHandler(args: string[]): Promise<number> {
  const sub = args[0];
  if (sub === "slice") {
    const rest = args.slice(1);
    const { value: target, rest: afterTarget } = takeValue(rest, "--for");
    const { value: orderId } = takeValue(afterTarget, "--for-order");
    await contextSliceCommand({
      target: requireArg(target, "--for <file>"),
      orderId,
    });
    return ExitCode.OK;
  }
  unknownSubcommand("context", sub);
}

async function splitHandler(args: string[]): Promise<number> {
  const file = requireArg(args[0], "<file>");
  const { value: at, rest } = takeValue(args.slice(1), "--at");
  const { value: agentId } = takeValue(rest, "--agent");
  await splitCommand({ file, at: requireArg(at, "--at <export|line>"), agentId });
  return ExitCode.OK;
}

const registry: Record<string, Handler> = {
  init: initHandler,
  validate: wrap(validateCommand),
  pipeline: wrap(pipelineCommand),
  heal: healHandler,
  add: (args) => runAddCommand(args),
  tokens: tokensHandler,
  api: wrap(apiCommand),
  db: wrap(dbCommand),
  context: contextHandler,
  split: splitHandler,
  plan: wrap(planCommand),
  order: wrap(orderCommand),
  lease: wrap(leaseCommand),
  conduct: wrap(conductCommand),
  ledger: wrap(ledgerCommand),
  bench: wrap(benchCommand),
  audit: wrap(auditCommand),
};

export function getCommandHandler(name: string): Handler | undefined {
  return registry[name];
}
