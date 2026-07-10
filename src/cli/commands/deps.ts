import { depsAdd } from "@/cli/commands/deps-add.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export async function depsCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub === "add") {
    await depsAdd(args.slice(1));
    return;
  }
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown deps subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
