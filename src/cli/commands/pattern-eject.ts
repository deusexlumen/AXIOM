import { resolve, basename } from "node:path";
import { readFile, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { countLoc } from "@/cli/commands/add-helpers.js";
import { hashString } from "@/cli/manifest/hash.js";
import { ComponentEntry } from "@/cli/schemas/agent-context.js";
import { z } from "zod/v3";

export interface EjectPatternOptions {
  cwd?: string;
  out?: NodeJS.WritableStream;
}

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

function notFoundError(name: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Pattern not found: ${name}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

function componentSpec(name: string): string {
  return `${JSON.stringify(
    {
      name,
      description: `Ejected pattern ${name}`,
      props: {},
      states: [],
      a11y: { role: "generic", focusable: false, requiredAria: [] },
      tokensUsed: [],
      forbidden: [],
    },
    null,
    2
  )}\n`;
}

export async function ejectPattern(name: string, options: EjectPatternOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ctx = await readContext(cwd);
  const patternIndex = ctx.patterns?.findIndex((p) => p.name === name) ?? -1;
  if (patternIndex === -1) notFoundError(name);

  const entry = ctx.patterns![patternIndex]!;
  const pascal = toPascal(name);
  const componentPath = `src/components/${pascal}.tsx`;
  const specPath = `src/components/${pascal}.spec.json`;

  if (ctx.components.some((c) => c.name === pascal) || existsSync(resolve(cwd, componentPath))) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V040", `Component ${pascal} already exists`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  const sourceIndex = resolve(cwd, entry.file);
  let indexContent = await readFile(sourceIndex, "utf-8");
  let shaderPath: string | undefined;

  if (entry.shader !== undefined) {
    const suffix = basename(entry.shader).replace(/^[^.]+/, "");
    const shaderName = `${pascal}${suffix || ".glsl"}`;
    shaderPath = `src/components/${shaderName}`;
    await copyFile(resolve(cwd, entry.shader), resolve(cwd, shaderPath));
    indexContent = indexContent.replace(`from "./shader${suffix}"`, `from "./${shaderName}"`);
  }

  await writeTextFile(resolve(cwd, componentPath), indexContent);
  await writeTextFile(resolve(cwd, specPath), componentSpec(name));

  const componentEntry: z.infer<typeof ComponentEntry> = {
    name: pascal,
    file: componentPath,
    spec: specPath,
    test: `src/components/${pascal}.test.tsx`,
    exports: [pascal],
    dependsOn: [],
    usedBy: [],
    loc: countLoc(indexContent),
    bytes: indexContent.length,
    status: "STALE",
    specHash: hashString(componentSpec(name)),
  };
  ctx.components.push(componentEntry);
  ctx.patterns!.splice(patternIndex, 1);

  const patternDir = resolve(cwd, `src/patterns/${name}`);
  if (existsSync(patternDir)) {
    await rm(patternDir, { recursive: true, force: true });
  }

  await writeContext(cwd, ctx);
  result({ ok: true, files: { component: componentPath, spec: specPath, shader: shaderPath } }, options.out);
}
