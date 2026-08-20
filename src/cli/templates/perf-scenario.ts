export function homePerfJson(): string {
  return JSON.stringify({
    route: "/",
    scenarios: [
      {
        name: "scroll-hero",
        // Matches the leading settle wait below: hydration, WebGL context
        // creation and shader compilation land in that window and are not what
        // this scenario measures.
        warmupMs: 500,
        steps: [
          { action: "wait", ms: 500 },
          { action: "scroll", y: 500 },
          { action: "wait", ms: 300 },
        ],
      },
    ],
    budgets: {
      maxFrameTimeMs: 16.7,
      maxLongTasks: 0,
    },
  }, null, 2);
}
