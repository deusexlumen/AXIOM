import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runAntiTemplateHeuristic } from "@/cli/critic/anti-template.js";
import { computeScores } from "@/cli/critic/score.js";
import { CriticReport, type CriticFinding, type CriticReport as CriticReportType } from "@/cli/schemas/critic-report.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export const CRITIC_REPORT_PATH = "CRITIC_REPORT.json";

function fallbackReport(route: string | undefined): CriticReportType {
  const rubrics = { directionalFidelity: 1, hierarchy: 1, typographicCraft: 1, motionCohesion: 1, detailDensity: 1, antiTemplate: 1 };
  return { rubrics, overall: 1, findings: [], heuristicFindings: [], model: "heuristic-fallback", timestamp: new Date().toISOString(), route };
}

export async function runCriticStage(cwd: string, scope?: string[]): Promise<StageResult> {
  const route = scope?.find((s) => s.startsWith("route:"))?.slice(6);
  let report: CriticReportType;
  try {
    const heuristicFindings = await runAntiTemplateHeuristic(cwd);
    const { rubrics, overall } = await computeScores(cwd, heuristicFindings);
    const findings: CriticFinding[] = heuristicFindings.map((f) => ({
      rubric: f.rubric,
      screenshot: f.evidence?.file ?? null,
      finding: `[${f.checkId}] ${f.message}`,
    }));
    report = CriticReport.parse({ rubrics, overall, findings, heuristicFindings, model: "heuristic", timestamp: new Date().toISOString(), route });
  } catch (error) {
    const failure = error instanceof Error ? error.message : String(error);
    report = CriticReport.parse({
      ...fallbackReport(route),
      heuristicFindings: [
        {
          checkId: "AXM-R999",
          rubric: "antiTemplate",
          severity: "warning",
          message: `CRITIC stage encountered an error: ${failure}`,
          evidence: { file: CRITIC_REPORT_PATH, excerpt: "fallback report generated" },
        },
      ],
    });
  }
  await writeFile(resolve(cwd, CRITIC_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  return { ok: true };
}
