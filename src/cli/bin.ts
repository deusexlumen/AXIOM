#!/usr/bin/env node
import { ExitCode } from "@/cli/types.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ndjson } from "@/cli/utils/ndjson.js";
import { getCommandHandler } from "@/cli/commands/registry.js";

async function main(argv: string[]): Promise<number> {
  const [, , command, ...args] = argv;
  const handler = getCommandHandler(command ?? "");
  if (!handler) {
    throw new CliError(
      JSON.stringify(
        cliFixPacket("AXM-V000", command ? `Unknown command: ${command}` : "Missing command", ["I-11"])
      ),
      ExitCode.VALIDATION_ERROR
    );
  }
  return handler(args);
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
