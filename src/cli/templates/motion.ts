export function motionAxmJson(): string {
  return JSON.stringify(
    {
      ease: {
        hero: { curve: [0.16, 1, 0.3, 1], meaning: "große Enthüllungen" },
        snap: { curve: [0.83, 0, 0.17, 1], meaning: "UI-Feedback" },
        drift: { curve: [0.25, 0.1, 0.25, 1], meaning: "Ambient/Parallax" },
      },
      dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
      stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
      scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
      transitions: {
        pageEnter: { grammar: "mask-wipe-up", dur: "scene", ease: "hero" },
        pageExit: { grammar: "fade-scale-098", dur: "ui", ease: "snap" },
      },
      choreography: {
        revealOrder: ["display-text", "media", "body-text", "meta"],
        maxConcurrentTimelines: 3,
      },
      reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
    },
    null,
    2,
  );
}
