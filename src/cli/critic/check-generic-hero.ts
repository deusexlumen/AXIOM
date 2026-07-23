import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";
import type { ProjectFiles } from "@/cli/critic/collect-files.js";

function hasHero(source: string): boolean {
  const lowered = source.toLowerCase();
  const hasSection = lowered.includes("hero") || lowered.includes("<section");
  const hasBadge = lowered.includes("badge") || lowered.includes("pill") || /className=.*rounded-full/.test(source);
  return hasSection && hasBadge;
}

function hasHeadline(source: string): boolean {
  return /<h1\b/i.test(source) && /<p\b/i.test(source);
}

function hasTwoCtas(source: string): boolean {
  const buttonMatches = source.match(/<button\b/gi) ?? [];
  const anchorMatches = source.match(/<a\b/gi) ?? [];
  return buttonMatches.length + anchorMatches.length >= 2;
}

export function checkGenericHero(files: ProjectFiles): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const combined = Object.values(files.tsxSources).join("\n");
  if (hasHero(combined) && hasHeadline(combined) && hasTwoCtas(combined)) {
    const file = Object.keys(files.tsxSources).find((p) => /hero/i.test(p)) ?? Object.keys(files.tsxSources)[0] ?? "page.tsx";
    findings.push({
      checkId: "AXM-R005",
      rubric: "antiTemplate",
      severity: "warning",
      message: "Generic Hero+Badge+CTA layout detected (centered pill, headline, subheadline, two CTAs).",
      evidence: { file, excerpt: "hero / badge / h1 / p / button|a" },
    });
  }
  return findings;
}
