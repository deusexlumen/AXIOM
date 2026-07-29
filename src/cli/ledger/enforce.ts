import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readLedger } from "@/cli/ledger/store.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { LedgerEntry, LedgerRule } from "@/cli/schemas/ledger.js";

export type LedgerViolation = { entry: LedgerEntry; file: string; evidence: string };

export async function runLedgerEnforcement(cwd: string, context: AgentContext): Promise<LedgerViolation[]> {
  const entries = (await readLedger(cwd)).filter((e) => e.class === "enforced" && e.rule !== null);
  const out: LedgerViolation[] = [];
  for (const entry of entries) out.push(...(await checkRule(cwd, context, entry)));
  return out;
}

async function checkRule(cwd: string, context: AgentContext, entry: LedgerEntry): Promise<LedgerViolation[]> {
  const rule = entry.rule!;
  switch (rule.type) {
    case "forbidden-dependency":
      return checkForbiddenDependency(cwd, entry, rule);
    case "forbidden-import-path":
    case "required-token-usage":
    case "forbidden-api-pattern":
      return scanComponents(cwd, context, entry, rule);
    default:
      return [];
  }
}

async function readPackageJson(cwd: string): Promise<Record<string, unknown>> {
  try {
    return JSON.parse(await readFile(resolve(cwd, "package.json"), "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function checkForbiddenDependency(
  cwd: string,
  entry: LedgerEntry,
  rule: Extract<LedgerRule, { type: "forbidden-dependency" }>
): Promise<LedgerViolation[]> {
  const pkg = await readPackageJson(cwd);
  const deps = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) } as Record<string, unknown>);
  const hit = deps.find((d) => rule.match.includes(d));
  return hit ? [{ entry, file: "package.json", evidence: `forbidden dependency: ${hit}` }] : [];
}

function findInvalidPattern(patterns: string[]): string | undefined {
  for (const pattern of patterns) {
    try {
      new RegExp(pattern, "u");
    } catch {
      return pattern;
    }
  }
  return undefined;
}

async function scanComponents(
  cwd: string,
  context: AgentContext,
  entry: LedgerEntry,
  rule: Extract<LedgerRule, { type: "forbidden-import-path" | "required-token-usage" | "forbidden-api-pattern" }>
): Promise<LedgerViolation[]> {
  const invalid = findInvalidPattern(rule.match);
  if (invalid) {
    return [
      {
        entry,
        file: context.components[0]?.file ?? "ledger/decisions.ndjson",
        evidence: `invalid regex pattern: ${invalid}`,
      },
    ];
  }

  const out: LedgerViolation[] = [];
  for (const component of context.components) {
    const content = await readFile(resolve(cwd, component.file), "utf-8");
    const hit = rule.match.find((m) => new RegExp(m, "u").test(content));
    if (hit) out.push({ entry, file: component.file, evidence: `${rule.type}: ${hit}` });
  }
  return out;
}
