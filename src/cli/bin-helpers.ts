import { ExitCode } from "@/cli/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";

export function takeValue(args: string[], flag: string): { value?: string; rest: string[] } {
  const i = args.indexOf(flag);
  if (i === -1) return { rest: args };
  const value = args[i + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Missing value for ${flag}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const rest = args.slice();
  rest.splice(i, 2);
  return { value, rest };
}

export function requireArg(value: string | undefined, name: string): string {
  if (!value) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Missing required argument: ${name}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  return value;
}
