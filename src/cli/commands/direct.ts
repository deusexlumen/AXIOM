import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { DirectionJson } from "@/cli/schemas/direction.js";
import { BriefJson } from "@/cli/schemas/brief.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import { buildFixPacket } from "@/cli/validate/packet.js";
import { styleTileOrder } from "@/cli/templates/style-tile-order.js";
import { selectPresetForBrief } from "@/cli/presets/catalog.js";
import { freezeDirection } from "@/cli/commands/direct-freeze.js";
import { sampleDirection, bespokeDirection } from "@/cli/commands/direct-directions.js";
import { directAmend } from "@/cli/commands/direct-amend.js";
import { ExitCode } from "@/cli/types.js";

const CANDIDATES = ["A", "B", "C"] as const;

export interface DirectGenerateOptions {
  cwd: string;
  out?: NodeJS.WritableStream;
}

export interface DirectChooseOptions {
  cwd: string;
  directionId: string;
  out?: NodeJS.WritableStream;
}

export { directAmend };

async function loadBriefSafe(cwd: string): Promise<BriefJson | undefined> {
  try {
    const raw = await readFile(resolve(cwd, "BRIEF.axm.json"), "utf-8");
    return BriefJson.parse(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

export async function directGenerate({ cwd, out }: DirectGenerateOptions): Promise<void> {
  const brief = await loadBriefSafe(cwd);

  if (brief?.track === "curated") {
    const preset = selectPresetForBrief(brief);
    await freezeDirection(cwd, preset, preset.directionId);
    result({ ok: true, track: "curated", directionId: preset.directionId, frozen: true }, out);
    return;
  }

  for (const candidate of CANDIDATES) {
    const path = resolve(cwd, `DIRECTION_${candidate}.axm.json`);
    await mkdir(dirname(path), { recursive: true });
    const direction = brief ? bespokeDirection(candidate, brief) : sampleDirection(candidate);
    await writeFile(path, `${JSON.stringify(direction, null, 2)}\n`, "utf-8");
  }

  const ordersDir = resolve(cwd, "orders", "open");
  await mkdir(ordersDir, { recursive: true });
  const orders: WorkOrder[] = [];
  for (const candidate of CANDIDATES) {
    const order = styleTileOrder(`dir_${candidate.toLowerCase()}`);
    await writeFile(resolve(ordersDir, `${order.orderId}.json`), `${JSON.stringify(order, null, 2)}\n`, "utf-8");
    orders.push(order);
  }
  result({ ok: true, track: brief?.track ?? "bespoke", candidates: CANDIDATES.map((c) => `dir_${c}`), orders: orders.map((o) => o.orderId) }, out);
}

export async function directChoose({ cwd, directionId, out }: DirectChooseOptions): Promise<void> {
  const candidate = directionId.replace(/^dir_/, "").toUpperCase();
  if (!CANDIDATES.includes(candidate as (typeof CANDIDATES)[number])) {
    throw new CliError(
      JSON.stringify(
        buildFixPacket(
          "AXM-V000",
          `Unknown direction candidate: ${directionId}`,
          "DIRECTION.axm.json",
          ["I-20"],
          "Choose one of dir_A, dir_B, or dir_C.",
          "Unknown direction candidate."
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const sourcePath = resolve(cwd, `DIRECTION_${candidate}.axm.json`);
  const raw = await readFile(sourcePath, "utf-8");
  const parsed = DirectionJson.parse(JSON.parse(raw));
  await freezeDirection(cwd, parsed, directionId);

  result({ ok: true, directionId, frozen: true }, out);
}
