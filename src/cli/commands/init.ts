import { mkdir, readFile, cp, rm } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
import { execSync } from "node:child_process";
import { appFiles } from "@/cli/templates/app.js";
import { ownershipFiles } from "@/cli/templates/ownership.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { tokensBuild } from "@/cli/commands/tokens-build.js";
import { routeManifestTs } from "@/cli/generators/route.js";
import { writeLeases } from "@/cli/leases/store.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";
import { fileURLToPath } from "node:url";

export interface InitOptions {
  cwd?: string;
  skipInstall?: boolean;
  out?: NodeJS.WritableStream;
}

export async function init(name: string, options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const targetDir = resolve(cwd, name);
  await mkdir(targetDir, { recursive: true });

  const projectName = basename(name);
  const created: string[] = [];
  for (const file of appFiles(projectName)) {
    const fullPath = resolve(targetDir, file.path);
    await writeTextFile(fullPath, file.content);
    created.push(file.path);
  }

  // Bundle the local eslint-plugin-axiom package so the generated app can lint itself.
  // init.js lives at <repo>/dist/cli/commands/ or <repo>/src/cli/commands/ during tests.
  const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const pluginSource = resolve(cliRoot, "packages/eslint-plugin-axiom");
  const pluginTarget = resolve(targetDir, "packages/eslint-plugin-axiom");
  await rm(pluginTarget, { recursive: true, force: true });
  await cp(pluginSource, pluginTarget, {
    recursive: true,
    filter: (source) => !source.includes("node_modules"),
  });
  created.push("packages/eslint-plugin-axiom");

  // Generate an empty route manifest so the core router can import it before any routes exist.
  const manifestPath = "src/generated/route-manifest.tsx";
  const initialManifest = routeManifestTs([]);
  await writeTextFile(resolve(targetDir, manifestPath), initialManifest);
  created.push(manifestPath);

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  await writeContext(targetDir, context);
  created.push("agent-context.json");

  // Initialize empty lease store so order/lease commands have a single source of truth.
  await writeLeases(targetDir, []);
  created.push(".axiom/leases.json");

  // Generate agent-facing docs from the context so they reflect project name and current rules.
  await writeTextFile(resolve(targetDir, ".cursorrules"), cursorRules(context));
  created.push(".cursorrules");
  await writeTextFile(resolve(targetDir, "CLAUDE.md"), claudeMd(context));
  created.push("CLAUDE.md");

  // Generate theme.css from tokens.json and update context integrity.
  await tokensBuild(targetDir, options.out);

  const updatedContext = await readContext(targetDir);
  const ownership = ownershipFiles();
  for (const file of ownership.locked) {
    updatedContext.integrity.lockedFiles[file] = await hashFile(resolve(targetDir, file));
  }
  for (const file of ownership.machine) {
    if (file === "agent-context.json") continue;
    updatedContext.integrity.machineFiles[file] = await hashFile(resolve(targetDir, file));
  }
  await writeContext(targetDir, updatedContext);

  if (!options.skipInstall) {
    execSync("pnpm install --prefer-offline", { cwd: targetDir, stdio: "ignore" });
  }

  const output: InitResult = {
    ok: true,
    created,
    next: "axm add component <Name>",
  };
  result(output, options.out);
}
