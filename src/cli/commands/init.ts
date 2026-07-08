import { mkdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execSync } from "node:child_process";
import { appFiles } from "@/cli/templates/app.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";

export interface InitOptions {
  cwd?: string;
  skipInstall?: boolean;
}

const LOCKED_FILES = ["src/core/router.ts", "src/core/error-boundary.tsx", "src/core/token-provider.tsx"];
const MACHINE_FILES = ["src/generated/theme.css", ".cursorrules", "CLAUDE.md"];

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

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  for (const file of LOCKED_FILES) {
    context.integrity.lockedFiles[file] = await hashFile(resolve(targetDir, file));
  }
  for (const file of MACHINE_FILES) {
    context.integrity.machineFiles[file] = await hashFile(resolve(targetDir, file));
  }
  await writeAgentContext(targetDir, context);

  if (!options.skipInstall) {
    execSync("pnpm install --prefer-offline", { cwd: targetDir, stdio: "ignore" });
  }

  const output: InitResult = {
    ok: true,
    created,
    next: "axm add component <Name>",
  };
  result(output);
}
