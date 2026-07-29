import { mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
import type { WorkOrder } from "@/cli/schemas/work-order.js";
import { pipelineCommand } from "@/cli/commands/pipeline.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { moveToBlocked, orderPath, writeOrderFile } from "@/cli/commands/plan-fs.js";
import { readLeases, writeLeases, withLeaseLock } from "@/cli/leases/store.js";
import { readOrderFile } from "@/cli/commands/order-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export async function orderComplete(orderId: string): Promise<void> {
  const cwd = process.cwd();
  const order = await readOrderFile(cwd, orderId);
  if (!order) throw notFound(orderId);
  if (order.status !== "CLAIMED") throw notClaimed(orderId);
  const scope = order.acceptance.pipelineScope ?? order.scope.writeAllowed[0] ?? "";
  try {
    await pipelineCommand(["run", "--scope", scope]);
  } catch (error) {
    await handleFailure(cwd, order, error);
    return;
  }
  await withLeaseLock(cwd, async () => {
    const leases = (await readLeases(cwd)).filter((l) => l.orderId !== orderId);
    await writeLeases(cwd, leases);
    await writeOrderFile(cwd, { ...order, status: "DONE", claimedBy: null });
    const agentId = order.claimedBy ?? "unknown";
    const now = new Date().toISOString();
    const context = await readContext(cwd);
    context.agents = (context.agents ?? [])
      .map((a) => (a.agentId === agentId ? { ...a, activeLease: null, lastHeartbeat: now } : a))
      .sort((a, b) => a.agentId.localeCompare(b.agentId));
    await writeContext(cwd, context);
    await mkdir(resolve(cwd, "orders", "done"), { recursive: true });
    await rename(orderPath(cwd, orderId, "open"), resolve(cwd, "orders", "done", `${orderId}.json`));
  });
  result({ ok: true, orderId, status: "DONE" });
}

async function handleFailure(cwd: string, order: WorkOrder, error: unknown): Promise<never> {
  const message = error instanceof Error ? error.message : String(error);
  const current = order.attempts.current + 1;
  const blocked = current >= order.attempts.max;
  await withLeaseLock(cwd, async () => {
    const leases = (await readLeases(cwd)).filter((l) => l.orderId !== order.orderId);
    await writeLeases(cwd, leases);
    if (blocked) {
      await moveToBlocked(
        cwd,
        { ...order, status: "OPEN", claimedBy: null, attempts: { ...order.attempts, current } },
        `attempts exhausted: ${message}`
      );
    } else {
      await writeOrderFile(cwd, {
        ...order,
        status: "OPEN",
        claimedBy: null,
        attempts: { ...order.attempts, current },
      });
    }
  });
  throw new CliError(
    JSON.stringify(
      cliFixPacket(
        blocked ? "AXM-W004" : "AXM-W003",
        `Order ${order.orderId} ${blocked ? "blocked" : "pipeline RED"}: ${message}`,
        ["I-11"]
      )
    ),
    blocked ? ExitCode.LEASE_ERROR : ExitCode.TEST_ERROR
  );
}

function notFound(orderId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-W001", `Order not found: ${orderId}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

function notClaimed(orderId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-W002", `Order ${orderId} is not CLAIMED`, ["I-11"])),
    ExitCode.LEASE_ERROR
  );
}
