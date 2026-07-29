import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";

const COST_FILE = "pipeline/bench/cost.ndjson";

interface CostEntry {
  timestamp: string;
  type: "slice" | "packet";
  target?: string;
  packetId?: string;
  stage?: string;
  estimatedTokens: number;
  orderId?: string;
  cached?: boolean;
  latencyMs?: number;
}

async function ensureCostFile(cwd: string): Promise<void> {
  await mkdir(resolve(cwd, "pipeline", "bench"), { recursive: true });
}

export async function logSliceCost(
  cwd: string,
  target: string,
  estimatedTokens: number,
  orderId: string | undefined,
  cached: boolean,
  latencyMs: number
): Promise<void> {
  await ensureCostFile(cwd);
  const entry: CostEntry = {
    timestamp: new Date().toISOString(),
    type: "slice",
    target,
    estimatedTokens,
    orderId,
    cached,
    latencyMs,
  };
  await appendFile(resolve(cwd, COST_FILE), `${JSON.stringify(entry)}\n`, "utf-8");
}

export async function logPacketCost(
  cwd: string,
  packetId: string,
  stage: string,
  estimatedTokens: number,
  orderId: string | undefined
): Promise<void> {
  await ensureCostFile(cwd);
  const entry: CostEntry = {
    timestamp: new Date().toISOString(),
    type: "packet",
    packetId,
    stage,
    estimatedTokens,
    orderId,
  };
  await appendFile(resolve(cwd, COST_FILE), `${JSON.stringify(entry)}\n`, "utf-8");
}
