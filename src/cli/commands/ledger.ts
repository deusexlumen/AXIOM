import { requireArg, takeValue } from "@/cli/bin-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { ledgerAdd } from "@/cli/commands/ledger-add.js";
import { ledgerQuery } from "@/cli/commands/ledger-query.js";

const LEDGER_CLASSES = new Set(["advisory", "enforced"]);

function parseClass(raw: string | undefined): "advisory" | "enforced" {
  const value = raw ?? "advisory";
  if (!LEDGER_CLASSES.has(value)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Invalid --class: ${value}. Must be advisory or enforced.`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  return value as "advisory" | "enforced";
}

export async function ledgerCommand(args: string[]): Promise<void> {
  const sub = args[0];
  const rest = args.slice(1);
  if (sub === "add") {
    const { value: decision } = takeValue(rest, "--decision");
    const { value: rationale } = takeValue(rest, "--rationale");
    const { value: scope } = takeValue(rest, "--scope");
    const { value: classRaw } = takeValue(rest, "--class");
    const { value: ruleRaw } = takeValue(rest, "--rule");
    return ledgerAdd({
      decision: requireArg(decision, "--decision <text>"),
      rationale: requireArg(rationale, "--rationale <text>"),
      scope: requireArg(scope, "--scope <scope>"),
      class: parseClass(classRaw),
      rule: ruleRaw ?? null,
    });
  }
  if (sub === "query") {
    const { value: scope } = takeValue(rest, "--scope");
    return ledgerQuery(scope);
  }
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown ledger subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
