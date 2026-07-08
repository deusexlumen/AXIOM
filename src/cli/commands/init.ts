import { mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { appFiles } from "@/cli/templates/app.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";

export interface InitOptions {
  cwd?: string;
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

  const output: InitResult = {
    ok: true,
    created,
    next: "axm add component <Name>",
  };
  result(output);
}
