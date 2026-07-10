import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { generateComponent, defaultComponentSpec } from "@/cli/generators/component.js";
import { ComponentSpec } from "@/cli/schemas/component-spec.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import {
  countLoc,
  componentExists,
  componentFile,
  specFile,
  testFile,
  duplicateError,
} from "@/cli/commands/add-helpers.js";
import { requireActiveLease } from "@/cli/leases/scope.js";
import { ComponentEntry } from "@/cli/schemas/agent-context.js";
import { z } from "zod/v3";

export interface AddComponentOptions {
  spec?: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
  agentId?: string;
}

export async function addComponent(name: string, options: AddComponentOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ctx = await readContext(cwd);
  if (componentExists(ctx, name)) {
    duplicateError(`Component ${name} already exists`);
  }
  const spec = options.spec ? ComponentSpec.parse(JSON.parse(options.spec)) : defaultComponentSpec(name);
  const generated = generateComponent(name, spec);
  const comp = componentFile(name);
  const specPath = specFile(name);
  const testPath = testFile(name);
  if (options.agentId) await requireActiveLease(cwd, options.agentId, [comp, specPath, testPath]);
  await writeTextFile(resolve(cwd, comp), generated.component);
  await writeTextFile(resolve(cwd, specPath), generated.spec);
  await writeTextFile(resolve(cwd, testPath), generated.test);
  const entry: z.infer<typeof ComponentEntry> = {
    name,
    file: comp,
    spec: specPath,
    test: testPath,
    exports: [name],
    dependsOn: [],
    usedBy: [],
    loc: countLoc(generated.component),
    bytes: generated.component.length,
    status: "STALE",
    specHash: hashString(generated.spec),
  };
  ctx.components.push(entry);
  await writeContext(cwd, ctx);
  result({ ok: true, files: { component: comp, spec: specPath, test: testPath }, status: "STALE" }, options.out);
}
