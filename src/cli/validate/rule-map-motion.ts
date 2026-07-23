export const RULE_MAP_MOTION: Record<
  string,
  { code: string; invariants: string[]; fixHint: string; cause: string }
> = {
  "axiom/max-concurrent-timelines": {
    code: "AXM-N003",
    invariants: ["I-18"],
    fixHint:
      "Reduce the number of useChoreo() calls in this file or raise choreography.maxConcurrentTimelines in MOTION.axm.json via atl motion amend.",
    cause: "Component registers more concurrent timelines than the motion budget allows.",
  },
  "axiom/motion-token-usage": {
    code: "AXM-N001",
    invariants: ["I-18"],
    fixHint: "Replace raw ease/duration values with motion-token imports from @/generated/motion.",
    cause: "GSAP call uses a raw easing or duration value instead of a motion token.",
  },
  "axiom/no-direct-timeline": {
    code: "AXM-N002",
    invariants: ["I-18"],
    fixHint: "Create timelines via useChoreo() from @/core/useChoreo instead of calling gsap.timeline() directly.",
    cause: "Component calls gsap.timeline() outside a core wrapper.",
  },
  "axiom/require-reduced-motion": {
    code: "AXM-N004",
    invariants: ["I-19"],
    fixHint: "Add reducedMotion: 'opacity-only' | 'instant' | { strategy, durFactor } to the useChoreo() call.",
    cause: "Registered choreography does not declare a reduced-motion path.",
  },
  "axiom/no-raw-motion-engine": {
    code: "AXM-I018",
    invariants: ["I-18"],
    fixHint:
      "Move GSAP/Three/R3F imports into src/core/ wrappers (useChoreo or Stage) and consume those wrappers instead.",
    cause: "Component imports a motion/WebGL engine directly outside core wrappers.",
  },
};
