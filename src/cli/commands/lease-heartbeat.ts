import { readLeases, writeLeases, withLeaseLock } from "@/cli/leases/store.js";
import { result } from "@/cli/utils/ndjson.js";

export async function leaseHeartbeat(agentId: string): Promise<void> {
  const cwd = process.cwd();
  const now = new Date().toISOString();
  await withLeaseLock(cwd, async () => {
    const leases = (await readLeases(cwd)).map((l) => (l.agentId === agentId ? { ...l, heartbeatAt: now } : l));
    await writeLeases(cwd, leases);
  });
  result({ ok: true, agentId, heartbeatAt: now });
}
