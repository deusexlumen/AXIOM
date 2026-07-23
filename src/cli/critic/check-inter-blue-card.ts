import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";
import type { ProjectFiles } from "@/cli/critic/collect-files.js";

const BLUE_HEX_RE = /#(?:3B82F6|2563EB|1D4ED8|60A5FA|6366F1|4F46E5)/i;

function hasInter(files: ProjectFiles): boolean {
  const allCss = Object.values(files.cssSources).join("\n") + files.themeCss;
  return /font-family[^;]*Inter/i.test(allCss);
}

function hasBlue(files: ProjectFiles): boolean {
  const all = files.tokens + files.themeCss + Object.values(files.cssSources).join("\n");
  return BLUE_HEX_RE.test(all);
}

function hasCardGrid(files: ProjectFiles): boolean {
  const combined = Object.values(files.tsxSources).join("\n");
  const cardCount = (combined.match(/\bcard\b/gi) ?? []).length;
  const gridCount = (combined.match(/\bgrid\b/gi) ?? []).length;
  return cardCount >= 3 || (gridCount > 0 && cardCount >= 2);
}

export function checkInterBlueCard(files: ProjectFiles): HeuristicFinding[] {
  if (!hasInter(files) || !hasBlue(files) || !hasCardGrid(files)) return [];
  const file = Object.keys(files.tsxSources).find((p) => /card/i.test(p)) ?? Object.keys(files.tsxSources)[0] ?? "page.tsx";
  return [
    {
      checkId: "AXM-R006",
      rubric: "antiTemplate",
      severity: "critical",
      message: "Inter + Blue + Card-grid signature detected — strong template aesthetic.",
      evidence: { file, excerpt: "Inter font-family + blue primary + card/grid" },
    },
  ];
}
