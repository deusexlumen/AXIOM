#!/usr/bin/env node
import { ExitCode } from "@/cli/types.js";
import { init } from "@/cli/commands/init.js";
import { validateCommand } from "@/cli/commands/validate.js";
import { ndjson } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";

async function main(argv: string[]): Promise<number> {
  const [, , command, ...args] = argv;

  if (command === "init") {
    const name = args[0];
    if (!name) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-V000", "Missing required argument: <name>", ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    await init(name);
    return ExitCode.OK;
  }

  if (command === "validate") {
    await validateCommand(args);
    return ExitCode.OK;
  }

  if (!command) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing command", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown command: ${command}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

main(process.argv).then(
  (code) => process.exit(code),
  (error: unknown) => {
    if (error instanceof CliError) {
      ndjson({ type: "result", ok: false, data: JSON.parse(error.message) });
      process.exit(error.exitCode);
    }
    const message = error instanceof Error ? error.message : String(error);
    ndjson({ type: "result", ok: false, data: { message } });
    process.exit(ExitCode.INTERNAL_ERROR);
  }
);
