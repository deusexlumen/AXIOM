import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { PerfAnalysis } from "@/cli/pipeline/stages/perf-trace.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export function buildPerfFailure(
  scenarioName: string,
  analysis: PerfAnalysis,
  maxFrameMs: number,
  maxLongTasks: number,
  frameBudget: number,
  file: string
): StageResult {
  const budgetExceeded = analysis.worstFrames.some((f) => f.durationMs > frameBudget);
  const longTaskExceeded = analysis.longTasks.length > maxLongTasks;
  const worst = analysis.worstFrames[0];
  const attributed = analysis.attributedChoreoId ?? "unknown";
  let message: string;
  let probableCause: string;
  let fixHint: string;
  if (budgetExceeded && longTaskExceeded) {
    message = `Frame and long task budgets exceeded during scenario "${scenarioName}" (worst=${worst?.durationMs.toFixed(2) ?? 0}ms > ${frameBudget.toFixed(2)}ms; longTasks=${String(analysis.longTasks.length)} > ${String(maxLongTasks)}).`;
    probableCause = `Frame and long task budgets exceeded during scenario "${scenarioName}"; attributed choreography: ${attributed}.`;
    fixHint = "Reduce motion complexity or split the choreography, and break long JavaScript tasks into smaller chunks.";
  } else if (budgetExceeded) {
    message = `Frame budget exceeded during scenario "${scenarioName}" (worst=${worst?.durationMs.toFixed(2) ?? 0}ms > ${frameBudget.toFixed(2)}ms).`;
    probableCause = `Frame budget exceeded during scenario "${scenarioName}"; attributed choreography: ${attributed}.`;
    fixHint = "Reduce motion complexity or split the attributed choreography into smaller timelines.";
  } else {
    message = `Long task budget exceeded during scenario "${scenarioName}" (${String(analysis.longTasks.length)} > ${String(maxLongTasks)}).`;
    probableCause = `Long task budget exceeded during scenario "${scenarioName}".`;
    fixHint = "Break the long JavaScript task into smaller chunks or defer non-critical work.";
  }
  const packet = buildPipelinePacket(
    "AXM-G001",
    message,
    file,
    1,
    1,
    "perf",
    ["I-18"],
    {
      traceSummary: {
        scenarioName,
        worstFrames: analysis.worstFrames,
        longTasks: analysis.longTasks.slice(0, 5),
        p95FrameMs: analysis.p95FrameMs,
        p99FrameMs: analysis.p99FrameMs,
        lcpMs: analysis.lcpMs,
        clsScore: analysis.clsScore,
        attributedChoreoId: attributed,
      },
    }
  );
  packet.probableCause = probableCause;
  packet.fixHint = fixHint;
  return { ok: false, packet };
}
