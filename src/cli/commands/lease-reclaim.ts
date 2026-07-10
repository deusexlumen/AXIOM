import { execSync } from "node:child_process";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { moveToBlocked, writeOrderFile } from "@/cli/commands/plan-fs.js";
import { readLeases, writeLeases, withLeaseLock } from "@/cli/leases/store.js";
import { readOrderFile, upsertAgent } from "@/cli/commands/order-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import type { WorkOrder } from "@/cli/schemas/work-order.js";

export async function leaseReclaim(): Promise<void> {
  const cwd = process.cwd();
  const now = new Date().toISOString();
  const reclaimed = await withLeaseLock(cwd, async () => {
    const leases = await readLeases(cwd);
    const expired = leases.filter(isExpired);
    await writeLeases(
      cwd,
      leases.filter((l) => !expired.includes(l))
    );
    const ids: string[] = [];
    for (const lease of expired) {
      const order = await readOrderFile(cwd, lease.orderId);
      if (!order || order.status !== "CLAIMED") continue;
      rollbackScope(cwd, lease.scope);
      await releaseOrder(cwd, order, lease);
      const context = await readContext(cwd);
      context.agents = upsertAgent(context.agents ?? [], lease.agentId, null, now);
      await writeContext(cwd, context);
      ids.push(lease.orderId);
    }
    return ids;
  });
  result({ ok: true, reclaimed });
}

function isExpired(lease: { heartbeatAt: string; ttlSeconds: number }): boolean {
  return Date.now() - new Date(lease.heartbeatAt).getTime() > lease.ttlSeconds * 1000;
}

async function releaseOrder(cwd: string, order: WorkOrder, lease: { agentId: string }): Promise<void> {
  const current = order.attempts.current + 1;
  const exhausted = current >= order.attempts.max;
  if (exhausted) {
    await moveToBlocked(cwd, order, `dead agent ${lease.agentId}: attempts exhausted`);
    return;
  }
  await writeOrderFile(cwd, {
    ...order,
    status: "OPEN",
    claimedBy: null,
    attempts: { ...order.attempts, current },
  });
}

function rollbackScope(cwd: string, scope: string[]): void {
  try {
    const commit = execSync('git rev-list --max-count=1 --grep="AXIOM-GREEN"', {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (!commit) return;
    execSync(`git checkout ${commit} -- ${scope.join(" ")}`, { cwd, stdio: "ignore" });
  } catch {
    // Git unavailable or no GREEN commit: skip filesystem rollback
  }
}
