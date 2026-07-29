import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { writeContext } from "@/cli/commands/validate.integration.context.js";

type Ctx = {
  integrity: { machineFiles: Record<string, string>; lockedFiles: Record<string, string> };
  components: unknown[];
  [key: string]: unknown;
};

export function installComponent(dir: string, name: string, file: string, content: string): void {
  const ctx = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8")) as Ctx;
  const spec = file.replace(/\.tsx?$/, ".spec.json");
  ctx.components = [
    {
      name,
      file,
      spec,
      test: file.replace(/\.tsx?$/, ".test.tsx"),
      exports: [name],
      dependsOn: [],
      usedBy: [],
      loc: content.split("\n").length,
      bytes: Buffer.byteLength(content),
      status: "STALE",
      specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      lastPipelineRun: "2026-07-08T00:00:00Z",
    },
  ];
  writeFileSync(join(dir, file), content);
  writeFileSync(join(dir, spec), JSON.stringify({ name, description: name, props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] }));
  writeContext(dir, ctx);
}
