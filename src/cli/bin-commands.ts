import { ExitCode } from "@/cli/types.js";
import { addComponent } from "@/cli/commands/add.js";
import { addRoute } from "@/cli/commands/add-route.js";
import { addStore } from "@/cli/commands/add-store.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { takeValue, requireArg } from "@/cli/bin-helpers.js";

export async function runAddCommand(args: string[]): Promise<number> {
  const sub = args[0];
  const { value: agentId, rest } = takeValue(args.slice(1), "--agent");
  const resolvedAgent = agentId ? requireArg(agentId, "--agent <id>") : undefined;

  if (sub === "component") {
    const name = requireArg(rest[0], "<Name>");
    const { value: spec } = takeValue(rest.slice(1), "--spec");
    await addComponent(name, { spec, agentId: resolvedAgent });
    return ExitCode.OK;
  }
  if (sub === "route") {
    const path = requireArg(rest[0], "<path>");
    const { value: componentValue, rest: remaining } = takeValue(rest.slice(1), "--component");
    const component = requireArg(componentValue, "--component <Name>");
    if (remaining.length > 0) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-V000", `Unexpected arguments: ${remaining.join(" ")}`, ["I-11"])),
        ExitCode.VALIDATION_ERROR
      );
    }
    await addRoute(path, { component, agentId: resolvedAgent });
    return ExitCode.OK;
  }
  if (sub === "store") {
    const name = requireArg(rest[0], "<name>");
    const { value: shape } = takeValue(rest.slice(1), "--shape");
    await addStore(name, { shape, agentId: resolvedAgent });
    return ExitCode.OK;
  }
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown add subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
