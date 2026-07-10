import { readLeases } from "@/cli/leases/store.js";
import { result } from "@/cli/utils/ndjson.js";

export async function leaseList(): Promise<void> {
  const leases = await readLeases(process.cwd());
  result({ leases });
}
