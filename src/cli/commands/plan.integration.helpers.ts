import { expect } from "vitest";
import { writeFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { planCommand } from "@/cli/commands/plan.js";
import { CliError } from "@/cli/errors.js";
import { captureStream, parseLastLine } from "@/cli/commands/context.integration.helpers.js";

export function sampleBrief(track: "curated" | "bespoke" = "curated"): Record<string, unknown> {
  return {
    track,
    brand: { name: "Test", oneLiner: "Test.", existingAssets: [], voice: ["clear"] },
    audience: { who: "users", device: "balanced", attention: "explorativ" },
    goal: { primary: "awareness", successMetric: "time on site" },
    references: [
      { url: "https://a.co", liked: [], disliked: [] },
      { url: "https://b.co", liked: [], disliked: [] },
    ],
    mood: { words: ["clean", "modern"], antiWords: ["clutter"] },
    content: { sections: ["hero"], assets: "vorhanden" },
    constraints: { deadlineDays: 14, mustHave: [], verboten: [] },
    webglAppetite: 0,
  };
}

export function writeBrief(dir: string, track: "curated" | "bespoke" = "curated"): void {
  writeFileSync(join(dir, "BRIEF.axm.json"), `${JSON.stringify(sampleBrief(track), null, 2)}\n`, "utf-8");
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
