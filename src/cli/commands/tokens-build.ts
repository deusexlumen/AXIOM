import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { TokensJson } from "@/cli/schemas/tokens.js";
import { themeCss } from "@/cli/generators/tokens.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";

export async function tokensBuild(cwd: string, out?: NodeJS.WritableStream): Promise<void> {
  const tokensPath = resolve(cwd, "tokens.json");
  const raw = await readFile(tokensPath, "utf-8");
  const tokens = TokensJson.parse(JSON.parse(raw));
  const css = themeCss(tokens);
  const cssPath = "src/generated/theme.css";
  await writeTextFile(resolve(cwd, cssPath), css);
  const context = await readContext(cwd);
  context.tokens.hash = hashString(raw);
  context.integrity.machineFiles[cssPath] = hashString(css);
  await writeContext(cwd, context);
  result({ ok: true, files: [cssPath] }, out);
}
