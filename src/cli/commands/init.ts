import { mkdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execSync } from "node:child_process";
import { appFiles, ownershipFiles } from "@/cli/templates/app.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { writeAgentContext, serializeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";

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

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  const ownership = ownershipFiles();
  for (const file of ownership.locked) {
    context.integrity.lockedFiles[file] = await hashFile(resolve(targetDir, file));
  }
  for (const file of ownership.machine) {
    if (file === "agent-context.json") continue;
    context.integrity.machineFiles[file] = await hashFile(resolve(targetDir, file));
  }

  // Compute self-hash from the in-memory object (without self-entry), then write once.
  const selfHash = hashString(serializeAgentContext(context));
  context.integrity.machineFiles["agent-context.json"] = selfHash;
  await writeAgentContext(targetDir, context);
  created.push("agent-context.json");

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
