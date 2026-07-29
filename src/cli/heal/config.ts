import { resolve } from "node:path";
import { readdir, readFile } from "node:fs/promises";
import { AxiomConfig } from "@/cli/schemas/config.js";
import { readLastPacket } from "@/cli/commands/heal-helpers.js";
import type { PacketRef } from "@/cli/heal/types.js";

export async function loadConfig(cwd: string): Promise<AxiomConfig> {
  const raw = await readFile(resolve(cwd, "axiom.config.json"), "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return AxiomConfig.parse(parsed);
}

export async function loadPackets(cwd: string): Promise<PacketRef[]> {
  const dir = resolve(cwd, "pipeline", "fix-packets");
  const entries: PacketRef[] = [];
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return entries;
  }
  for (const name of names.sort()) {
    if (!name.endsWith(".ndjson")) continue;
    const file = `pipeline/fix-packets/${name}`;
    const packet = await readLastPacket(resolve(cwd, file));
    entries.push({ file, packet });
  }
  return entries;
}
