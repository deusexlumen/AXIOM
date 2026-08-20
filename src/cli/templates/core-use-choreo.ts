export function useChoreoTs(): string {
  return `"use client";
import { useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { motion } from "@/generated/motion";

gsap.registerPlugin(ScrollTrigger, CustomEase);

type EaseToken = keyof typeof motion.ease;

const easeFns = Object.fromEntries(
  Object.entries(motion.ease).map(([key, curve]) => [key, CustomEase.create(key, curve.join(","))]),
) as Record<EaseToken, ReturnType<typeof CustomEase.create>>;

export function ease(token: EaseToken): ReturnType<typeof CustomEase.create> {
  return easeFns[token];
}

interface ReducedMotionOptions {
  strategy: "opacity-only" | "instant" | "none";
  durFactor?: number;
}

interface ChoreoOptions {
  id: string;
  reducedMotion: ReducedMotionOptions | "opacity-only" | "instant";
}

interface ChoreoResult {
  timeline: gsap.core.Timeline;
  isReducedMotion: boolean;
  reducedMotionOptions: ReducedMotionOptions;
}

// Refcounted per choreo id: several instances of the same pattern share one id
// and therefore one budget slot. A plain Set cannot express that — the second
// instance would re-enter the limiter, and the first to unmount would release
// the slot while its siblings are still animating.
const activeChoreoIds = new Map<string, number>();
const maxConcurrentTimelines = motion.choreography.maxConcurrentTimelines;

function retainChoreoId(id: string): void {
  activeChoreoIds.set(id, (activeChoreoIds.get(id) ?? 0) + 1);
}

function releaseChoreoId(id: string): boolean {
  const count = activeChoreoIds.get(id);
  if (count === undefined) return false;
  if (count <= 1) {
    activeChoreoIds.delete(id);
    return true;
  }
  activeChoreoIds.set(id, count - 1);
  return false;
}

function normalizeReducedMotion(
  input: ReducedMotionOptions | "opacity-only" | "instant",
): ReducedMotionOptions {
  if (typeof input === "string") {
    return { strategy: input };
  }
  return input;
}

export function useChoreo(options: ChoreoOptions): ChoreoResult {
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const reducedMotionOptions = normalizeReducedMotion(options.reducedMotion);

  const timeline = useMemo(() => {
    if (!activeChoreoIds.has(options.id) && activeChoreoIds.size >= maxConcurrentTimelines) {
      const oldestId = activeChoreoIds.keys().next().value;
      if (oldestId !== undefined) {
        console.warn(\`AXM-N003: Too many concurrent choreographies (\${String(activeChoreoIds.size + 1)}/\${String(maxConcurrentTimelines)}). Killing oldest timeline "\${oldestId}". Consolidate or split the component.\`);
        const oldest = gsap.getById(oldestId);
        oldest?.kill();
        activeChoreoIds.delete(oldestId);
      }
    }
    retainChoreoId(options.id);
    performance.mark(\`choreo:\${options.id}:start\`);
    return gsap.timeline({ id: options.id, onComplete: () => {
      performance.mark(\`choreo:\${options.id}:end\`);
    }});
  }, [options.id]);

  useEffect(() => {
    return () => {
      performance.mark(\`choreo:\${options.id}:end\`);
      timeline.kill();
      // Only the last instance holding this id tears down the shared
      // ScrollTriggers; siblings may still be animating.
      if (releaseChoreoId(options.id)) {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.vars.id === options.id) st.kill();
        });
      }
    };
  }, [timeline, options.id]);

  return { timeline, isReducedMotion, reducedMotionOptions };
}
`;
}
