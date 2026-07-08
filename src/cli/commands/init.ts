import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { appFiles } from "@/cli/templates/app.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";

export async function init(name: string): Promise<void> {
  const targetDir = resolve(process.cwd(), name);
  await mkdir(targetDir, { recursive: true });

  const created: string[] = [];
  for (const file of appFiles(name)) {
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
