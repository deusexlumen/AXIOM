import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod/v3";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { AgentLease } from "@/cli/schemas/agent-context.js";

type AgentLeaseType = z.infer<typeof AgentLease>;

export async function readOrderFile(cwd: string, orderId: string): Promise<WorkOrder | undefined> {
  for (const folder of ["open", "blocked", "done"] as const) {
    try {
      const raw = await readFile(resolve(cwd, "orders", folder, `${orderId}.json`), "utf-8");
      return WorkOrder.parse(JSON.parse(raw));
    } catch {
      // try next folder
    }
  }
  return undefined;
}

export async function readAllOrders(cwd: string): Promise<WorkOrder[]> {
  const all: WorkOrder[] = [];
  for (const folder of ["open", "blocked", "done"] as const) {
    const dir = resolve(cwd, "orders", folder);
    let names: string[] = [];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
      const raw = await readFile(resolve(dir, name), "utf-8");
      all.push(WorkOrder.parse(JSON.parse(raw)));
    }
  }
  return all;
}

export function dependenciesDone(order: WorkOrder, doneIds: Set<string>): string[] {
  return order.dependsOn.filter((d) => !doneIds.has(d));
}

export function upsertAgent(
  agents: AgentLeaseType[],
  agentId: string,
  leaseId: string | null,
  heartbeatAt: string
): AgentLeaseType[] {
  const next = agents.filter((a) => a.agentId !== agentId);
  next.push({ agentId, role: "worker", activeLease: leaseId, lastHeartbeat: heartbeatAt });
  return next.sort((a, b) => a.agentId.localeCompare(b.agentId));
}
