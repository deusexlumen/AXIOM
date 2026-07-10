import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { readLedger, appendLedger, nextLedgerId, ledgerSummary, ledgerPath } from "@/cli/ledger/store.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { LedgerRule } from "@/cli/schemas/ledger.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";

const LEDGER_FILE = "ledger/decisions.ndjson";
const LEDGER_CLASSES = new Set(["advisory", "enforced"]);

function assertClass(value: string): asserts value is "advisory" | "enforced" {
  if (!LEDGER_CLASSES.has(value)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Invalid class: ${value}. Must be advisory or enforced.`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
}

export async function ledgerAdd(options: {
  decision: string;
  rationale: string;
  scope: string;
  class: "advisory" | "enforced";
  rule: string | null;
}): Promise<void> {
  assertClass(options.class);
  const cwd = process.cwd();
  const entries = await readLedger(cwd);
  const rule = options.rule ? LedgerRule.parse(JSON.parse(options.rule)) : null;
  const entry = {
    id: nextLedgerId(entries),
    date: new Date().toISOString(),
    scope: options.scope,
    decision: options.decision,
    rationale: options.rationale,
    class: options.class,
    rule,
    supersedes: null,
  };
  await appendLedger(cwd, entry);
  const context = await readContext(cwd);
  context.ledger = ledgerSummary([...entries, entry]);
  context.integrity.machineFiles[LEDGER_FILE] = await hashFile(ledgerPath(cwd));
  await writeContext(cwd, context);
  result({ ok: true, id: entry.id });
}
