import { Lease } from "@/cli/schemas/lease.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeOrderFile } from "@/cli/commands/plan-fs.js";
import { readLeases, writeLeases, withLeaseLock } from "@/cli/leases/store.js";
import { dependenciesDone, readAllOrders, readOrderFile, upsertAgent } from "@/cli/commands/order-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export async function orderClaim(orderId: string, agentId: string): Promise<void> {
  const cwd = process.cwd();
  await withLeaseLock(cwd, async () => {
    const order = await readOrderFile(cwd, orderId);
    if (!order) throw notFound(orderId);
    if (order.status !== "OPEN") throw notOpen(orderId, order.status);
    const all = await readAllOrders(cwd);
    const doneIds = new Set(all.filter((o) => o.status === "DONE").map((o) => o.orderId));
    const missing = dependenciesDone(order, doneIds);
    if (missing.length > 0) throw depsNotDone(orderId, missing);
    const leases = await readLeases(cwd);
    const conflict = leases.find(
      (l) => l.orderId !== orderId && l.scope.some((s) => order.scope.writeAllowed.includes(s))
    );
    if (conflict) throw leaseConflict(orderId, conflict.leaseId);
    const now = new Date().toISOString();
    const lease: Lease = {
      leaseId: `lease_${orderId}_${agentId}_${order.attempts.current}`,
      agentId,
      orderId,
      scope: order.scope.writeAllowed,
      acquiredAt: now,
      ttlSeconds: 300,
      heartbeatAt: now,
    };
    await writeLeases(cwd, [...leases, lease]);
    await writeOrderFile(cwd, { ...order, status: "CLAIMED", claimedBy: agentId });
    const context = await readContext(cwd);
    context.agents = upsertAgent(context.agents ?? [], agentId, lease.leaseId, now);
    await writeContext(cwd, context);
  });
  result({ ok: true, orderId, agentId, status: "CLAIMED" });
}

function notFound(orderId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-W001", `Order not found: ${orderId}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

function notOpen(orderId: string, status: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-W002", `Order ${orderId} is ${status}, not OPEN`, ["I-11"])),
    ExitCode.LEASE_ERROR
  );
}

function depsNotDone(orderId: string, missing: string[]): never {
  throw new CliError(
    JSON.stringify(
      cliFixPacket("AXM-W002", `Dependencies not DONE for ${orderId}: ${missing.join(", ")}`, ["I-11"])
    ),
    ExitCode.LEASE_ERROR
  );
}

function leaseConflict(orderId: string, leaseId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-M001", `Scope conflict for ${orderId} with ${leaseId}`, ["I-17"])),
    ExitCode.LEASE_ERROR
  );
}
