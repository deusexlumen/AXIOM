import { resolve, extname } from "node:path";
import { copyFile } from "node:fs/promises";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { AssetOptions } from "@/cli/assets/types.js";
import { IMAGE_EXTS, validationError, nameFromPath, ensureDir } from "@/cli/assets/common.js";

export async function addImage(path: string, options: AssetOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ext = extname(path).toLowerCase();
  if (!IMAGE_EXTS.has(ext)) validationError(`Unsupported image extension: ${ext}`);

  const name = nameFromPath(path);
  const targetDir = resolve(cwd, "public/images");
  await ensureDir(targetDir);
  const targetExt = ext === ".jpeg" ? ".jpg" : ext;
  const targetPath = resolve(targetDir, `${name}${targetExt}`);
  await copyFile(resolve(cwd, path), targetPath);

  const metaPath = resolve(targetDir, `${name}.meta.json`);
  const meta = {
    name,
    src: `/images/${name}${targetExt}`,
    dimensions: { width: 0, height: 0 },
    placeholder: { dominantColor: "#000000", blur: "" },
  };
  await writeTextFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`);

  result({ ok: true, files: { image: `public/images/${name}${targetExt}`, meta: `public/images/${name}.meta.json` } }, options.out);
}
