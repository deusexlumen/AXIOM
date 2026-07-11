import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
import { execSync } from "node:child_process";
import { appFiles } from "@/cli/templates/app.js";
import { ownershipFiles } from "@/cli/templates/ownership.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { motionAxmJson } from "@/cli/templates/motion.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { tokensBuild } from "@/cli/commands/tokens-build.js";
import { routeManifestTs } from "@/cli/generators/route.js";
import { writeLeases } from "@/cli/leases/store.js";
import { bundleEslintPlugin, bundleCliPackage } from "@/cli/commands/init-bundle.js";
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

  // init.js lives at <repo>/dist/cli/commands/ or <repo>/src/cli/commands/ during tests.
  const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

  await bundleEslintPlugin(targetDir, cliRoot);
  created.push("packages/eslint-plugin-axiom");

  await bundleCliPackage(targetDir, cliRoot);
  created.push("packages/axiom-cli");

  const manifestPath = "src/generated/route-manifest.tsx";
  const initialManifest = routeManifestTs([]);
  await writeTextFile(resolve(targetDir, manifestPath), initialManifest);
  created.push(manifestPath);

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  await writeContext(targetDir, context);
  created.push("agent-context.json");

  await writeLeases(targetDir, []);
  created.push(".axiom/leases.json");

  await writeTextFile(resolve(targetDir, ".cursorrules"), cursorRules(context));
  created.push(".cursorrules");
  await writeTextFile(resolve(targetDir, "CLAUDE.md"), claudeMd(context));
  created.push("CLAUDE.md");

  await writeTextFile(resolve(targetDir, "MOTION.axm.json"), motionAxmJson());
  created.push("MOTION.axm.json");

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
