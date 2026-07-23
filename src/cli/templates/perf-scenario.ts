export function homePerfJson(): string {
  return JSON.stringify({
    route: "/",
    scenarios: [
      {
        name: "scroll-hero",
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
