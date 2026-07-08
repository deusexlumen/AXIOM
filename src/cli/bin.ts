#!/usr/bin/env node
import { ExitCode } from "@/cli/types.js";
import { init } from "@/cli/commands/init.js";
import { validateCommand } from "@/cli/commands/validate.js";
import { fail, ndjson } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";

async function main(argv: string[]): Promise<number> {
  const [, , command, ...args] = argv;

  if (command === "init") {
    const name = args[0];
    if (!name) {
      fail("Missing required argument: <name>", ExitCode.VALIDATION_ERROR);
    }
    await init(name);
    return ExitCode.OK;
  }

  if (command === "validate") {
    await validateCommand(args);
    return ExitCode.OK;
  }

  if (!command) {
    fail("Missing command", ExitCode.VALIDATION_ERROR);
  }

  fail(`Unknown command: ${command}`, ExitCode.VALIDATION_ERROR);
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
