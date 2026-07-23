import { mkdir } from "node:fs/promises";
import { basename, extname } from "node:path";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export const FONT_EXTS = new Set([".ttf", ".otf", ".woff2"]);
export const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".svg"]);
export const MODEL_EXTS = new Set([".gltf", ".glb"]);
export const DEFAULT_TEXTURE_MB = 64;

export function validationError(message: string): never {
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", message, ["I-11"])), ExitCode.VALIDATION_ERROR);
}

export function budgetError(message: string): never {
  throw new CliError(JSON.stringify(cliFixPacket("AXM-G003", message, ["I-02"])), ExitCode.VALIDATION_ERROR);
}

export function nameFromPath(path: string): string {
  const base = basename(path);
  return base.replace(extname(base), "");
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}
