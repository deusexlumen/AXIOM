import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";
import type { ProjectFiles } from "@/cli/critic/collect-files.js";

const TAILWIND_DEFAULTS: Record<string, string> = {
  "blue-500": "#3B82F6",
  "indigo-500": "#6366F1",
  "slate-950": "#020617",
  "gray-900": "#111827",
  "zinc-950": "#09090B",
  "red-500": "#EF4444",
  "emerald-500": "#10B981",
};

function scanText(text: string): string[] {
  const hits: string[] = [];
  for (const [name, hex] of Object.entries(TAILWIND_DEFAULTS)) {
    const hexVariants = [hex.toUpperCase(), hex.toLowerCase()];
    if (hexVariants.some((h) => text.includes(h)) || text.includes(name)) {
      hits.push(`${name} (${hex})`);
    }
  }
  return hits;
}

export function checkTailwindDefaults(files: ProjectFiles): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const tokenHits = scanText(files.tokens);
  if (tokenHits.length > 0) {
    findings.push({
      checkId: "AXM-R004",
      rubric: "antiTemplate",
      severity: "warning",
      message: `tokens.json contains unchanged Tailwind default colors: ${tokenHits.join(", ")}.`,
      evidence: { file: "tokens.json", excerpt: tokenHits.join("; ").slice(0, 120) },
    });
  }
  const cssHits = scanText(files.themeCss);
  if (cssHits.length > 0) {
    findings.push({
      checkId: "AXM-R004",
      rubric: "antiTemplate",
      severity: "warning",
      message: `Generated theme.css contains unchanged Tailwind default colors: ${cssHits.join(", ")}.`,
      evidence: { file: "src/generated/theme.css", excerpt: cssHits.join("; ").slice(0, 120) },
    });
  }
  const tsxHits = scanText(Object.values(files.tsxSources).join("\n"));
  if (tsxHits.length > 0) {
    findings.push({
      checkId: "AXM-R004",
      rubric: "antiTemplate",
      severity: "warning",
      message: `TSX sources contain unchanged Tailwind default colors: ${tsxHits.join(", ")}.`,
      evidence: { file: "tsx sources", excerpt: tsxHits.join("; ").slice(0, 120) },
    });
  }
  return findings;
}
