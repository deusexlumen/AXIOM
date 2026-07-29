import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Vision } from "@/cli/schemas/vision.js";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { VisionStatus } from "@/cli/schemas/agent-context.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export interface PlanOptions {
  cwd?: string;
  out?: NodeJS.WritableStream;
}

export async function loadVision(cwd: string, relativePath: string): Promise<Vision> {
  const path = resolve(cwd, relativePath);
  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", `Vision file not found: ${relativePath}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", `Vision file is not valid JSON: ${relativePath}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const validated = Vision.safeParse(parsed);
  if (!validated.success) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", `Vision schema invalid: ${validated.error.message}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  return validated.data;
}

export function parseDelta(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {
    // try key=value fallback
  }
  const result: Record<string, unknown> = {};
  for (const part of raw.split(",")) {
    const [key, ...rest] = part.split("=");
    if (!key) continue;
    result[key.trim()] = rest.join("=");
  }
  if (Object.keys(result).length === 0) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-P001", "Delta is neither valid JSON nor key=value pairs", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  return result;
}

export function upsertVision(
  visions: { visionId: string; status: VisionStatus }[],
  id: string,
  status: VisionStatus
): void {
  const idx = visions.findIndex((v) => v.visionId === id);
  if (idx >= 0) {
    const vision = visions[idx];
    if (vision) vision.status = status;
  } else visions.push({ visionId: id, status });
  visions.sort((a, b) => a.visionId.localeCompare(b.visionId));
}

export function countOrders(open: WorkOrder[], blocked: WorkOrder[]) {
  return {
    open: open.filter((o) => o.status === "OPEN").length,
    active: open.filter((o) => o.status === "CLAIMED" || o.status === "IN_PROGRESS").length,
    done: open.filter((o) => o.status === "DONE").length,
    blocked: blocked.filter((o) => o.status === "BLOCKED").length,
  };
}

export function preserveActiveState(target: WorkOrder, source: WorkOrder): void {
  target.status = source.status;
  target.claimedBy = source.claimedBy;
  target.attempts = source.attempts;
}

export function missingVisionError(visionId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-P001", `Vision not found: ${visionId}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
