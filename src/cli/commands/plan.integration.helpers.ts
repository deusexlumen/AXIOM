import { expect } from "vitest";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { planCommand } from "@/cli/commands/plan.js";
import { CliError } from "@/cli/errors.js";
import { captureStream, parseLastLine } from "@/cli/commands/context.integration.helpers.js";

const fixturePath = join(process.cwd(), "test", "fixtures", "vision");

export function readVision(name: string): string {
  return readFileSync(join(fixturePath, `${name}.json`), "utf-8");
}

export function writeVision(dir: string, name: string): void {
  writeFileSync(join(dir, "VISION.axm.json"), readVision(name), "utf-8");
}

export function orderContents(dir: string): string {
  const names = readdirSync(join(dir, "orders", "open"))
    .filter((n) => n.endsWith(".json"))
    .sort();
  return names.map((n) => readFileSync(join(dir, "orders", "open", n), "utf-8")).join("\n---\n");
}

export async function runPlan(dir: string, args: string[] = []): Promise<Record<string, unknown>> {
  const capture = captureStream();
  await planCommand(args, { cwd: dir, out: capture.stream });
  const line = parseLastLine(capture.output());
  return (line.data ?? line) as Record<string, unknown>;
}

export async function expectPlanError(dir: string, args: string[], code: string): Promise<void> {
  await expect(planCommand(args, { cwd: dir })).rejects.toSatisfy((err: unknown) => {
    if (!(err instanceof CliError)) return false;
    const packet = JSON.parse(err.message) as { errorCode: string };
    return packet.errorCode === code;
  });
}
