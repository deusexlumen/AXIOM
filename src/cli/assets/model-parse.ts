import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface GltfSummary {
  textureBytes: number;
  bufferBytes: number;
}

interface GltfImage {
  uri?: string;
  bufferView?: number;
}

interface GltfBufferView {
  byteLength?: number;
  byteOffset?: number;
}

interface GltfBuffer {
  byteLength?: number;
  uri?: string;
}

interface GltfJson {
  images?: GltfImage[];
  buffers?: GltfBuffer[];
  bufferViews?: GltfBufferView[];
}

function parseDataUriByteLength(uri: string): number {
  const match = /^data:.*?;base64,(.*)$/.exec(uri);
  if (!match || match[1] === undefined) return 0;
  const base64 = match[1];
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}

async function textureBytesFromImage(dir: string, image: GltfImage, bufferViews?: GltfBufferView[]): Promise<number> {
  if (image.uri !== undefined) {
    if (image.uri.startsWith("data:")) return parseDataUriByteLength(image.uri);
    const imagePath = resolve(dir, image.uri);
    return existsSync(imagePath) ? (await readFile(imagePath)).length : 0;
  }
  if (image.bufferView !== undefined) {
    const view = bufferViews?.[image.bufferView];
    return view?.byteLength ?? 0;
  }
  return 0;
}

export async function summarizeGltf(cwd: string, path: string): Promise<GltfSummary> {
  const content = await readFile(resolve(cwd, path), "utf-8");
  const json = JSON.parse(content) as GltfJson;
  const dir = resolve(cwd, path, "..");

  let textureBytes = 0;
  for (const image of json.images ?? []) {
    textureBytes += await textureBytesFromImage(dir, image, json.bufferViews);
  }

  let bufferBytes = 0;
  for (const buffer of json.buffers ?? []) {
    bufferBytes += buffer.byteLength ?? 0;
  }

  return { textureBytes, bufferBytes };
}

export async function summarizeGlb(cwd: string, path: string): Promise<GltfSummary> {
  const buffer = await readFile(resolve(cwd, path));
  if (buffer.length < 12) return { textureBytes: 0, bufferBytes: 0 };

  const length = buffer.readUInt32LE(8);
  let offset = 12;
  let jsonChunk: Buffer | undefined;
  let binChunk: Buffer | undefined;

  while (offset < length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4e4f534a) jsonChunk = chunk;
    if (chunkType === 0x004e4942) binChunk = chunk;
    offset += 8 + chunkLength;
  }

  if (!jsonChunk) return { textureBytes: 0, bufferBytes: binChunk?.length ?? 0 };
  const json = JSON.parse(jsonChunk.toString("utf-8")) as GltfJson;
  let textureBytes = 0;
  for (const image of json.images ?? []) {
    if (image.bufferView !== undefined) {
      const view = json.bufferViews?.[image.bufferView];
      textureBytes += view?.byteLength ?? 0;
    }
  }
  return { textureBytes, bufferBytes: binChunk?.length ?? 0 };
}
