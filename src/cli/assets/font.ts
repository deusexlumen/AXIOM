import { resolve, extname } from "node:path";
import { readFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { AssetOptions } from "@/cli/assets/types.js";
import { FONT_EXTS, validationError, nameFromPath, ensureDir } from "@/cli/assets/common.js";

async function readLayout(cwd: string): Promise<string> {
  const path = resolve(cwd, "app/layout.tsx");
  if (!existsSync(path)) return "";
  return readFile(path, "utf-8");
}

async function writeLayout(cwd: string, content: string): Promise<void> {
  await writeTextFile(resolve(cwd, "app/layout.tsx"), content);
}

export async function addFont(path: string, options: AssetOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ext = extname(path).toLowerCase();
  if (!FONT_EXTS.has(ext)) validationError(`Unsupported font extension: ${ext}`);

  const name = nameFromPath(path);
  const targetDir = resolve(cwd, "public/fonts");
  await ensureDir(targetDir);
  const targetPath = resolve(targetDir, `${name}.woff2`);
  await copyFile(resolve(cwd, path), targetPath);

  const stylesDir = resolve(cwd, "src/styles");
  await ensureDir(stylesDir);
  const cssPath = resolve(stylesDir, "fonts.css");
  const css = existsSync(cssPath) ? await readFile(cssPath, "utf-8") : "";
  const rule = `@font-face {\n  font-family: "${name}";\n  src: url("/fonts/${name}.woff2") format("woff2");\n  font-display: block;\n}\n`;
  if (!css.includes(`font-family: "${name}"`)) {
    await writeTextFile(cssPath, `${css}${rule}`);
  }

  const layout = await readLayout(cwd);
  const importLine = `import "@/styles/fonts.css";`;
  if (layout.length > 0 && !layout.includes(importLine)) {
    await writeLayout(cwd, `${importLine}\n${layout}`);
  }

  result({ ok: true, files: { font: `public/fonts/${name}.woff2`, css: "src/styles/fonts.css" } }, options.out);
}
