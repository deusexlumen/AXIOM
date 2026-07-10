import { mkdir, readFile, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { LedgerEntry } from "@/cli/schemas/ledger.js";
import { hashString } from "@/cli/manifest/hash.js";

const LEDGER_FILE = "ledger/decisions.ndjson";

export function ledgerPath(cwd: string): string {
  return resolve(cwd, LEDGER_FILE);
}

export async function readLedger(cwd: string): Promise<LedgerEntry[]> {
  let raw: string;
  try {
    raw = await readFile(ledgerPath(cwd), "utf-8");
  } catch {
    return [];
  }
  const entries: LedgerEntry[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    entries.push(LedgerEntry.parse(JSON.parse(line)));
  }
  return entries;
}

export async function appendLedger(cwd: string, entry: LedgerEntry): Promise<void> {
  await mkdir(resolve(cwd, "ledger"), { recursive: true });
  await appendFile(ledgerPath(cwd), `${JSON.stringify(entry)}\n`, "utf-8");
}

export function nextLedgerId(entries: LedgerEntry[]): string {
  const last = entries[entries.length - 1];
  const n = last ? Number(last.id.replace("DEC-", "")) : 0;
  return `DEC-${String(n + 1).padStart(4, "0")}`;
}

export function ledgerSummary(entries: LedgerEntry[]): { entries: number; lastId: string; hash: string } {
  const last = entries[entries.length - 1];
  return {
    entries: entries.length,
    lastId: last?.id ?? "DEC-0000",
    hash: last ? hashString(JSON.stringify(last)) : hashString(""),
  };
}
