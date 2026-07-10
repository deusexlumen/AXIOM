import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { WorkOrder } from "@/cli/schemas/work-order.js";
import { deterministicStringify } from "@/cli/commands/plan-helpers.js";

export function orderPath(cwd: string, orderId: string, folder: "open" | "blocked" = "open"): string {
  return resolve(cwd, "orders", folder, `${orderId}.json`);
}

export async function ensureOrderDirs(cwd: string): Promise<void> {
  await mkdir(resolve(cwd, "orders", "open"), { recursive: true });
  await mkdir(resolve(cwd, "orders", "blocked"), { recursive: true });
}

export async function writeOrderFile(cwd: string, order: WorkOrder): Promise<void> {
  await ensureOrderDirs(cwd);
  await writeFile(orderPath(cwd, order.orderId, "open"), deterministicStringify(order), "utf-8");
}

export async function readOrderFiles(cwd: string, folder: "open" | "blocked" = "open"): Promise<WorkOrder[]> {
  const dir = resolve(cwd, "orders", folder);
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const orders: WorkOrder[] = [];
  for (const name of names.filter((n) => n.endsWith(".json")).sort()) {
    const raw = await readFile(resolve(dir, name), "utf-8");
    orders.push(WorkOrder.parse(JSON.parse(raw)));
  }
  return orders;
}

export async function moveToBlocked(cwd: string, order: WorkOrder, reason: string): Promise<WorkOrder> {
  await ensureOrderDirs(cwd);
  const blocked: WorkOrder = {
    ...order,
    status: "BLOCKED",
    agentInstruction: `[BLOCKED: ${reason}] ${order.agentInstruction}`,
  };
  await writeFile(orderPath(cwd, order.orderId, "blocked"), deterministicStringify(blocked), "utf-8");
  await rm(orderPath(cwd, order.orderId, "open"), { force: true });
  return blocked;
}

export async function deleteOrderFile(
  cwd: string,
  orderId: string,
  folder: "open" | "blocked" = "open"
): Promise<void> {
  await rm(orderPath(cwd, orderId, folder), { force: true });
}
