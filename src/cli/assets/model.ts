import { resolve, extname } from "node:path";
import { readFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { AssetOptions } from "@/cli/assets/types.js";
import { MODEL_EXTS, DEFAULT_TEXTURE_MB, validationError, budgetError, nameFromPath, ensureDir } from "@/cli/assets/common.js";
import { summarizeGltf, summarizeGlb } from "@/cli/assets/model-parse.js";

interface BudgetContainer {
  budgets?: { maxTextureMB?: number };
}

async function budgetFromFile(cwd: string, fileName: string): Promise<number | undefined> {
  const path = resolve(cwd, fileName);
  if (!existsSync(path)) return undefined;
  try {
    const content = await readFile(path, "utf-8");
    const json = JSON.parse(content) as BudgetContainer;
    return json.budgets?.maxTextureMB;
  } catch {
    return undefined;
  }
}

async function resolveTextureBudget(cwd: string): Promise<number> {
  return (await budgetFromFile(cwd, "MOTION.axm.json")) ?? (await budgetFromFile(cwd, "pattern.json")) ?? DEFAULT_TEXTURE_MB;
}

export async function addModel(path: string, options: AssetOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ext = extname(path).toLowerCase();
  if (!MODEL_EXTS.has(ext)) validationError(`Unsupported model extension: ${ext}`);

  const summary = ext === ".glb" ? await summarizeGlb(cwd, path) : await summarizeGltf(cwd, path);
  const textureMB = summary.textureBytes / (1024 * 1024);
  const budgetMB = await resolveTextureBudget(cwd);

  if (textureMB > budgetMB) {
    budgetError(`Model texture memory ${textureMB.toFixed(2)}MB exceeds budget ${budgetMB}MB`);
  }

  const name = nameFromPath(path);
  const targetDir = resolve(cwd, "public/models");
  await ensureDir(targetDir);
  const targetPath = resolve(targetDir, `${name}${ext}`);
  await copyFile(resolve(cwd, path), targetPath);

  const ctx = await readContext(cwd);
  if (!ctx.assets) ctx.assets = [];
  ctx.assets.push({ type: "model", name, src: `public/models/${name}${ext}`, textureMB, budgetMB });
  await writeContext(cwd, ctx);

  result({ ok: true, files: { model: `public/models/${name}${ext}` }, textureMB, budgetMB }, options.out);
}
