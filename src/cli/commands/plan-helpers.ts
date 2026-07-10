import { VisionEntity } from "@/cli/schemas/vision.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "");
}

export function safePath(path: string): string {
  const normalized = safeId(path.replace(/^\//, "").replace(/\//g, "_"));
  return normalized || "root";
}

export function parseRef(fieldType: string): string | undefined {
  const match = /^ref\(([^)]+)\)$/.exec(fieldType);
  return match?.[1];
}

export function topoSortEntities(entities: VisionEntity[]): VisionEntity[] {
  const byName = new Map(entities.map((e) => [e.name, e]));
  const incoming = new Map(entities.map((e) => [e.name, new Set<string>()]));
  const outgoing = new Map(entities.map((e) => [e.name, [] as string[]]));

  for (const entity of entities) {
    for (const type of Object.values(entity.fields)) {
      const dep = parseRef(type);
      if (!dep || !byName.has(dep)) continue;
      incoming.get(entity.name)?.add(dep);
      outgoing.get(dep)?.push(entity.name);
    }
  }

  const sorted: VisionEntity[] = [];
  const queue = entities
    .filter((e) => (incoming.get(e.name)?.size ?? 0) === 0)
    .map((e) => e.name)
    .sort();

  while (queue.length > 0) {
    const name = queue.shift() as string;
    const entity = byName.get(name);
    if (!entity) continue;
    sorted.push(entity);
    for (const next of outgoing.get(name) ?? []) {
      const set = incoming.get(next);
      if (!set) continue;
      set.delete(name);
      if (set.size === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }

  if (sorted.length !== entities.length) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P002", "Entity dependency cycle detected", ["I-03"])),
      ExitCode.VALIDATION_ERROR
    );
  }

  return sorted;
}

export function deterministicStringify(value: unknown): string {
  return `${JSON.stringify(value, replacer, 2)}\n`;

  function replacer(_key: string, val: unknown): unknown {
    if (Array.isArray(val)) return val;
    if (val !== null && typeof val === "object") {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(val as Record<string, unknown>).sort()) {
        sorted[key] = (val as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return val;
  }
}
