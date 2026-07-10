import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { writeOrderFile } from "@/cli/commands/plan-fs.js";
import { readLeases, writeLeases, withLeaseLock } from "@/cli/leases/store.js";
import { readOrderFile } from "@/cli/commands/order-helpers.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export async function orderRelease(orderId: string): Promise<void> {
  const cwd = process.cwd();
  await withLeaseLock(cwd, async () => {
    const order = await readOrderFile(cwd, orderId);
    if (!order) throw notFound(orderId);
    const leasesBefore = await readLeases(cwd);
    const lease = leasesBefore.find((l) => l.orderId === orderId);
    const leases = leasesBefore.filter((l) => l.orderId !== orderId);
    await writeLeases(cwd, leases);
    await writeOrderFile(cwd, { ...order, status: "OPEN", claimedBy: null });
    if (lease) {
      const context = await readContext(cwd);
      context.agents = (context.agents ?? [])
        .map((a) => (a.agentId === lease.agentId ? { ...a, activeLease: null } : a))
        .sort((a, b) => a.agentId.localeCompare(b.agentId));
      await writeContext(cwd, context);
    }
  });
  result({ ok: true, orderId, status: "OPEN" });
}

function notFound(orderId: string): never {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-W001", `Order not found: ${orderId}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}
