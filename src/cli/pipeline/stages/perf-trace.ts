export type TraceEvent = { name: string; ph: string; ts: number; dur?: number; args?: Record<string, unknown> };
export type FrameSample = { ts: number; durationMs: number; busyMs?: number };
export type PerfAnalysis = {
  p95FrameMs: number;
  p99FrameMs: number;
  /**
   * Busy time per counted frame, ascending. This - not the gap between draws -
   * is what the gate compares against the budget: a 200ms gap holding 66ms of
   * work means the renderer was overloaded for 66ms and idle for the rest,
   * which the viewer sees as a static page, not a 200ms freeze.
   */
  frameDurationsMs: number[];
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

// A gap between two DrawFrame events is only a slow frame if the renderer was
// actually working during it. An idle page simply stops drawing, and treating
// that silence as a 600ms frame reports idleness as jank — which is what this
// used to do once pages gained real layout and content could scroll out of view.
const MIN_BUSY_MS = 1;

// Traces contain nested and cross-thread tasks, so overlapping intervals must
// be merged - summing them raw yields a busy time larger than the window itself.
// Expects `tasks` sorted by ts.
function busyMsWithin(tasks: FrameSample[], from: number, to: number): number {
  let busy = 0;
  let spanStart = 0;
  let spanEnd = 0;
  let open = false;
  for (const task of tasks) {
    const start = Math.max(from, task.ts);
    const end = Math.min(to, task.ts + task.durationMs);
    if (end <= start) continue;
    if (open && start <= spanEnd) {
      spanEnd = Math.max(spanEnd, end);
      continue;
    }
    if (open) busy += spanEnd - spanStart;
    spanStart = start;
    spanEnd = end;
    open = true;
  }
  if (open) busy += spanEnd - spanStart;
  return busy;
}

export function analyzeTraceEvents(events: TraceEvent[]): PerfAnalysis {
  const timestamps: number[] = [];
  const longTasks: FrameSample[] = [];
  const tasks: FrameSample[] = [];
  const marks: Array<{ name: string; ts: number }> = [];
  let lcpMs: number | undefined;
  let clsScore = 0;
  for (const e of events) {
    const dur = e.dur ?? 0;
    if (e.name === "DrawFrame" && e.ph === "I") timestamps.push(e.ts / 1000);
    else if (e.ph === "X" && (e.name === "RunTask" || e.name === "Task")) {
      const sample = { ts: e.ts / 1000, durationMs: dur / 1000 };
      tasks.push(sample);
      if (dur > 50000) longTasks.push(sample);
    } else if (e.name.startsWith("choreo:") && (e.ph === "I" || e.ph === "R")) {
      // Chrome emits performance.mark as "R" in newer versions, "I" in older.
      marks.push({ name: e.name, ts: e.ts / 1000 });
    }
    else if (e.name === "largestContentfulPaint::Candidate") lcpMs = e.ts / 1000;
    else if (e.name === "LayoutShift" && e.ph === "I") {
      const score = Number((e.args?.data as Record<string, unknown> | undefined)?.score ?? 0);
      if (!Number.isNaN(score)) clsScore += score;
    }
  }
  timestamps.sort((a, b) => a - b);
  tasks.sort((a, b) => a.ts - b.ts);
  const frames: FrameSample[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const from = timestamps[i - 1]!;
    const to = timestamps[i]!;
    const duration = to - from;
    if (duration <= 0) continue;
    const busyMs = busyMsWithin(tasks, from, to);
    if (busyMs < MIN_BUSY_MS) continue;
    frames.push({ ts: from, durationMs: duration, busyMs });
  }
  const durations = frames.map((f) => f.busyMs ?? f.durationMs).sort((a, b) => a - b);
  const worstFrames = [...frames]
    .sort((a, b) => (b.busyMs ?? b.durationMs) - (a.busyMs ?? a.durationMs))
    .slice(0, 3);
  let attributedChoreoId: string | undefined;
  if (worstFrames.length > 0 && marks.length > 0) {
    const target = worstFrames[0]!.ts;
    const nearest = marks.reduce((best, m) => (Math.abs(m.ts - target) < Math.abs(best.ts - target) ? m : best), marks[0]!);
    attributedChoreoId = nearest.name.match(/^choreo:([^:]+):/)?.[1];
  }
  return {
    p95FrameMs: percentile(durations, 95),
    p99FrameMs: percentile(durations, 99),
    frameDurationsMs: durations,
    worstFrames,
    longTasks,
    lcpMs,
    clsScore: clsScore > 0 ? clsScore : undefined,
    attributedChoreoId,
  };
}
