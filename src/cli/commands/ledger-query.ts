import { readLedger } from "@/cli/ledger/store.js";
import { result } from "@/cli/utils/ndjson.js";

export async function ledgerQuery(scope: string | undefined): Promise<void> {
  const cwd = process.cwd();
  const entries = await readLedger(cwd);
  const filtered = scope
    ? entries.filter(
        (e) => e.scope === scope || e.scope.startsWith(`${scope}/`) || scope.startsWith(`${e.scope}/`)
      )
    : entries;
  result({ scope: scope ?? "all", entries: filtered });
}
