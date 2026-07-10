import { ExitCode } from "@/cli/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { healCommand } from "@/cli/commands/heal.js";

export async function healHandler(args: string[]): Promise<number> {
  const headless = args.includes("--headless");
  const auto = args.includes("--auto");
  if (!headless && !auto) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Unknown heal subcommand: ${args[0] ?? ""}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const rest = args.filter((a) => a !== "--headless" && a !== "--auto");
  const { value: maxRetries } = takeValue(rest, "--max-retries");
  await healCommand({
    headless,
    maxRetries: maxRetries ? Number(maxRetries) : undefined,
  });
  return ExitCode.OK;
}
