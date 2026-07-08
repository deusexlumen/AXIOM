import { ExitCode } from "@/cli/types.js";

export class CliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode
  ) {
    super(message);
    this.name = "CliError";
  }
}
