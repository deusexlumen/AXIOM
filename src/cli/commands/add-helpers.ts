import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function countLoc(content: string): number {
  return content.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      !trimmed.startsWith("//") &&
      !trimmed.startsWith("/*") &&
      !trimmed.startsWith("*/") &&
      !trimmed.startsWith("*")
    );
  }).length;
}

export function componentExists(context: AgentContext, name: string): boolean {
  return context.components.some((c) => c.name === name);
}

export function routeExists(context: AgentContext, path: string): boolean {
  return context.routes.some((r) => r.path === path);
}

export function componentFile(name: string): string {
  return `src/components/${name}.tsx`;
}

export function specFile(name: string): string {
  return `src/components/${name}.spec.json`;
}

export function testFile(name: string): string {
  return `src/components/${name}.test.tsx`;
}

export function duplicateError(message: string): never {
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V040", message, ["I-11"])), ExitCode.VALIDATION_ERROR);
}
