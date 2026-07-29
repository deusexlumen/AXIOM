import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { generateStore } from "@/cli/generators/store.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { requireActiveLease } from "@/cli/leases/scope.js";
import { StoreEntry } from "@/cli/schemas/agent-context.js";
import { z } from "zod/v3";
import type { StoreShape } from "@/cli/generators/store.js";

export interface AddStoreOptions {
  shape?: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
  agentId?: string;
}

export async function addStore(name: string, options: AddStoreOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ctx = await readContext(cwd);
  const shape: StoreShape = options.shape ? JSON.parse(options.shape) : {};
  const content = generateStore(name, shape);
  const file = `src/state/${name}Store.ts`;
  if (options.agentId) await requireActiveLease(cwd, options.agentId, [file]);
  await writeTextFile(resolve(cwd, file), content);
  const storeEntry: z.infer<typeof StoreEntry> = { name, file, shapeHash: hashString(JSON.stringify(shape)) };
  ctx.stores.push(storeEntry);
  await writeContext(cwd, ctx);
  result({ ok: true, files: { store: file } }, options.out);
}
