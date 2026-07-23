import { collectProjectFiles } from "@/cli/critic/collect-files.js";
import { checkSystemfont } from "@/cli/critic/check-systemfont.js";
import { checkTailwindDefaults } from "@/cli/critic/check-tailwind-defaults.js";
import { checkGenericHero } from "@/cli/critic/check-generic-hero.js";
import { checkInterBlueCard } from "@/cli/critic/check-inter-blue-card.js";
import { checkCustomEasings } from "@/cli/critic/check-custom-easings.js";
import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";

export async function runAntiTemplateHeuristic(cwd: string): Promise<HeuristicFinding[]> {
  const files = await collectProjectFiles(cwd);
  const checks = [checkSystemfont, checkTailwindDefaults, checkGenericHero, checkInterBlueCard, checkCustomEasings];
  const findings: HeuristicFinding[] = [];
  for (const check of checks) {
    findings.push(...check(files));
  }
  return findings;
}

export function heuristicCountByRubric(findings: HeuristicFinding[], rubric: HeuristicFinding["rubric"]): number {
  return findings.filter((f) => f.rubric === rubric).length;
}
