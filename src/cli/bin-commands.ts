import { ExitCode } from "@/cli/types.js";
import { addComponent } from "@/cli/commands/add.js";
import { addRoute } from "@/cli/commands/add-route.js";
import { addStore } from "@/cli/commands/add-store.js";
import { addPattern } from "@/cli/commands/pattern-add.js";
import { listPatternCommand } from "@/cli/commands/pattern-list.js";
import { ejectPattern } from "@/cli/commands/pattern-eject.js";
import { runAssetsCommand as assetsDispatcher } from "@/cli/commands/assets.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { takeValue, requireArg } from "@/cli/bin-helpers.js";
import type { PatternCategory } from "@/cli/schemas/pattern.js";

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

export async function runAssetsCommand(args: string[]): Promise<number> {
  const sub = requireArg(args[0], "<font|image|model>");
  const path = requireArg(args[1], "<path>");
  await assetsDispatcher(sub, path);
  return ExitCode.OK;
}

export async function runPatternCommand(args: string[]): Promise<number> {
  const sub = args[0];
  const { value: agentId, rest } = takeValue(args.slice(1), "--agent");
  const resolvedAgent = agentId ? requireArg(agentId, "--agent <id>") : undefined;

  if (sub === "list") {
    const { value: category } = takeValue(rest, "--category");
    listPatternCommand({ category: category as PatternCategory | undefined });
    return ExitCode.OK;
  }
  if (sub === "add") {
    const name = requireArg(rest[0], "<Name>");
    const { value: params } = takeValue(rest.slice(1), "--params");
    await addPattern(name, { params, agentId: resolvedAgent });
    return ExitCode.OK;
  }
  if (sub === "eject") {
    const name = requireArg(rest[0], "<Name>");
    await ejectPattern(name);
    return ExitCode.OK;
  }
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown pattern subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
