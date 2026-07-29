import { ExitCode } from "@/cli/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { takeValue } from "@/cli/bin-helpers.js";
import { healCommand } from "@/cli/commands/heal.js";

export async function healHandler(args: string[]): Promise<number> {
  const headless = args.includes("--headless");
  const auto = args.includes("--auto");
  if (!headless && !auto) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --headless or --auto", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const rest = args.filter((a) => a !== "--headless" && a !== "--auto");
  const { value: maxRetriesRaw } = takeValue(rest, "--max-retries");
  let maxRetries: number | undefined;
  if (maxRetriesRaw !== undefined) {
    const parsed = Number(maxRetriesRaw);
    if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-V000", `Invalid --max-retries value: ${maxRetriesRaw}`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    maxRetries = parsed;
  }
  await healCommand({
    headless,
    maxRetries,
  });
  return ExitCode.OK;
}
