export type TraceEvent = { name: string; ph: string; ts: number; dur?: number; args?: Record<string, unknown> };
export type FrameSample = { ts: number; durationMs: number };
export type PerfAnalysis = {
  p95FrameMs: number;
  p99FrameMs: number;
  worstFrames: FrameSample[];
  longTasks: FrameSample[];
  lcpMs?: number;
  clsScore?: number;
  attributedChoreoId?: string;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] ?? 0;
}

export function analyzeTraceEvents(events: TraceEvent[]): PerfAnalysis {
  const timestamps: number[] = [];
  const longTasks: FrameSample[] = [];
  const marks: Array<{ name: string; ts: number }> = [];
  let lcpMs: number | undefined;
  let clsScore = 0;
  for (const e of events) {
    const dur = e.dur ?? 0;
    if (e.name === "DrawFrame" && e.ph === "I") timestamps.push(e.ts / 1000);
    else if (e.ph === "X" && dur > 50000 && (e.name === "RunTask" || e.name === "Task")) {
      longTasks.push({ ts: e.ts / 1000, durationMs: dur / 1000 });
    } else if (e.name.startsWith("choreo:") && e.ph === "I") marks.push({ name: e.name, ts: e.ts / 1000 });
    else if (e.name === "largestContentfulPaint::Candidate") lcpMs = e.ts / 1000;
    else if (e.name === "LayoutShift" && e.ph === "I") {
      const score = Number((e.args?.data as Record<string, unknown> | undefined)?.score ?? 0);
      if (!Number.isNaN(score)) clsScore += score;
    }
  }
  timestamps.sort((a, b) => a - b);
  const frames: FrameSample[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const duration = timestamps[i]! - timestamps[i - 1]!;
    if (duration > 0) frames.push({ ts: timestamps[i - 1]!, durationMs: duration });
  }
  const durations = frames.map((f) => f.durationMs).sort((a, b) => a - b);
  const worstFrames = [...frames].sort((a, b) => b.durationMs - a.durationMs).slice(0, 3);
  let attributedChoreoId: string | undefined;
  if (worstFrames.length > 0 && marks.length > 0) {
    const target = worstFrames[0]!.ts;
    const nearest = marks.reduce((best, m) => (Math.abs(m.ts - target) < Math.abs(best.ts - target) ? m : best), marks[0]!);
    attributedChoreoId = nearest.name.match(/^choreo:([^:]+):/)?.[1];
  }
  return {
    p95FrameMs: percentile(durations, 95),
    p99FrameMs: percentile(durations, 99),
    worstFrames,
    longTasks,
    lcpMs,
    clsScore: clsScore > 0 ? clsScore : undefined,
    attributedChoreoId,
  };
}
