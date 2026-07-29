import { resolve, relative } from "node:path";
import { readFile } from "node:fs/promises";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { generateComponent, defaultComponentSpec } from "@/cli/generators/component.js";
import { validate } from "@/cli/commands/validate.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { countLoc, componentExists, componentFile, specFile, testFile } from "@/cli/commands/add-helpers.js";
import { requireActiveLease } from "@/cli/leases/scope.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import {
  createTsProject,
  findExportedFunction,
  collectReferencedNames,
  importsForNames,
} from "@/cli/commands/split-helpers.js";

export interface SplitOptions {
  file: string;
  at: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
  agentId?: string;
}

function normalizeFilePath(cwd: string, file: string): string {
  return relative(cwd, resolve(cwd, file)).replace(/\\/g, "/");
}

function notFoundError(message: string): never {
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", message, ["I-03", "I-11"])), ExitCode.VALIDATION_ERROR);
}

function duplicateError(message: string): never {
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V040", message, ["I-03"])), ExitCode.VALIDATION_ERROR);
}

function findComponent(context: AgentContext, file: string): { entry: AgentContext["components"][number]; index: number } {
  const index = context.components.findIndex((c) => c.file === file);
  if (index === -1) notFoundError(`Component file ${file} is not registered in agent-context.json`);
  return { entry: context.components[index]!, index };
}

export async function splitCommand(options: SplitOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const file = normalizeFilePath(cwd, options.file);
  const exportName = options.at;
  if (options.agentId) await requireActiveLease(cwd, options.agentId, [file]);

  const context = await readContext(cwd);
  const { entry: originalEntry } = findComponent(context, file);

  if (originalEntry.name === exportName) {
    notFoundError(`Cannot split the main export ${exportName} from its component file`);
  }
  if (componentExists(context, exportName)) {
    duplicateError(`Component ${exportName} already exists`);
  }

  const project = createTsProject();
  const sourcePath = resolve(cwd, file);
  const sourceFile = project.addSourceFileAtPath(sourcePath);
  const exported = findExportedFunction(sourceFile, exportName);
  if (exported === undefined) {
    notFoundError(`Export ${exportName} is not a function declaration or arrow function in ${file}`);
  }

  const referenced = collectReferencedNames(exported.node);
  const imports = importsForNames(sourceFile, referenced);

  const newComponentPath = componentFile(exportName);
  const newContent = `${imports.length > 0 ? `${imports.join("\n")}\n\n` : ""}${exported.text}\n`;
  await writeTextFile(resolve(cwd, newComponentPath), newContent);

  const generated = generateComponent(exportName, defaultComponentSpec(exportName));
  const newSpecPath = specFile(exportName);
  const newTestPath = testFile(exportName);
  await writeTextFile(resolve(cwd, newSpecPath), generated.spec);
  await writeTextFile(resolve(cwd, newTestPath), generated.test);

  exported.node.remove();
  sourceFile.addImportDeclaration({
    moduleSpecifier: `@/components/${exportName}`,
    namedImports: [{ name: exportName }],
  });
  await sourceFile.save();

  const updatedOriginal = await readFile(resolve(cwd, file), "utf-8");
  originalEntry.exports = originalEntry.exports.filter((e) => e !== exportName);
  originalEntry.dependsOn = [...new Set([...originalEntry.dependsOn, exportName])];
  originalEntry.loc = countLoc(updatedOriginal);
  originalEntry.bytes = updatedOriginal.length;
  originalEntry.status = "STALE";

  const newEntry: AgentContext["components"][number] = {
    name: exportName,
    file: newComponentPath,
    spec: newSpecPath,
    test: newTestPath,
    exports: [exportName],
    dependsOn: [],
    usedBy: [originalEntry.name],
    loc: countLoc(newContent),
    bytes: newContent.length,
    status: "STALE",
    specHash: hashString(generated.spec),
  };
  context.components.push(newEntry);
  await writeContext(cwd, context);

  await validate(cwd, options.out);

  result(
    {
      ok: true,
      files: { component: newComponentPath, spec: newSpecPath, test: newTestPath },
      original: { file, exports: originalEntry.exports },
    },
    options.out
  );
}
