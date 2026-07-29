import { resolve } from "node:path";
import { getPattern } from "@/cli/patterns/catalog.js";
import { generatePatternFiles } from "@/cli/generators/pattern.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { requireActiveLease } from "@/cli/leases/scope.js";
import { PatternEntry } from "@/cli/schemas/agent-context.js";
import { z } from "zod/v3";

export interface AddPatternOptions {
  params?: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
  agentId?: string;
}

function patternExists(context: { patterns?: { name: string }[] }, name: string): boolean {
  return context.patterns?.some((p) => p.name === name) ?? false;
}

function patternNotFoundError(name: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown pattern: ${name}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

export async function addPattern(name: string, options: AddPatternOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const item = getPattern(name);
  if (!item) patternNotFoundError(name);

  const ctx = await readContext(cwd);
  if (patternExists(ctx, name)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V040", `Pattern ${name} already exists`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  if (!ctx.patterns) ctx.patterns = [];

  const generated = generatePatternFiles(item, options.params);
  const dir = `src/patterns/${name}`;
  const patternJsonPath = `${dir}/pattern.json`;
  const indexPath = `${dir}/index.tsx`;
  const fixturePath = `${dir}/fixture.tsx`;
  const paths = [patternJsonPath, indexPath, fixturePath];
  if (generated.shaderGlsl !== undefined) paths.push(`${dir}/shader.frag.glsl`);

  if (options.agentId) await requireActiveLease(cwd, options.agentId, paths);

  await writeTextFile(resolve(cwd, patternJsonPath), generated.patternJson);
  await writeTextFile(resolve(cwd, indexPath), generated.indexTsx);
  await writeTextFile(resolve(cwd, fixturePath), generated.fixtureTsx);
  if (generated.shaderGlsl !== undefined) {
    await writeTextFile(resolve(cwd, `${dir}/shader.frag.glsl`), generated.shaderGlsl);
  }

  const entry: z.infer<typeof PatternEntry> = {
    name,
    category: item.category,
    file: indexPath,
    fixture: fixturePath,
    patternJson: patternJsonPath,
    shader: generated.shaderGlsl !== undefined ? `${dir}/shader.frag.glsl` : undefined,
    status: "STALE",
  };
  ctx.patterns.push(entry);
  await writeContext(cwd, ctx);

  result({ ok: true, files: { patternJson: patternJsonPath, index: indexPath, fixture: fixturePath } }, options.out);
}
