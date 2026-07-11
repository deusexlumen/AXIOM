import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { TokensJson } from "@/cli/schemas/tokens.js";
import { MotionJson } from "@/cli/schemas/motion.js";
import { themeCss } from "@/cli/generators/tokens.js";
import { motionTs } from "@/cli/generators/motion.js";
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

  const motionPath = resolve(cwd, "MOTION.axm.json");
  const motionRaw = await readFile(motionPath, "utf-8");
  const motionData = MotionJson.parse(JSON.parse(motionRaw));
  const motionCode = motionTs(motionData);
  const motionTsPath = "src/generated/motion.ts";
  await writeTextFile(resolve(cwd, motionTsPath), motionCode);

  const context = await readContext(cwd);
  context.tokens.hash = hashString(raw);
  context.integrity.machineFiles[cssPath] = hashString(css);
  context.integrity.machineFiles[motionTsPath] = hashString(motionCode);
  await writeContext(cwd, context);
  result({ ok: true, files: [cssPath, motionTsPath] }, out);
}
