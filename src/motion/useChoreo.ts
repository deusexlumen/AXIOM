import type { RefObject } from "react";
import { gsap, useGSAP } from "@/motion/gsap";
import { EASE, DUR, REDUCED } from "@/motion/tokens";
import { useReducedMotion } from "@/motion/useReducedMotion";

export interface ChoreoCtx {
  gsap: typeof gsap;
  reduced: boolean;
  ease: (n: keyof typeof EASE) => string;
  dur: (n: keyof typeof DUR) => number;
}

export function useChoreo(
  build: (ctx: ChoreoCtx) => void,
  deps: unknown[] = [],
  scope?: RefObject<HTMLElement | null>,
): void {
  const reduced = useReducedMotion();
  useGSAP(
    () => {
      const ctx: ChoreoCtx = {
        gsap,
        reduced,
        ease: (n) => `cubic-bezier(${EASE[n].join(",")})`,
        dur: (n) => DUR[n] * (reduced ? REDUCED.durFactor : 1),
      };
      build(ctx);
    },
    { scope: scope as never, dependencies: [reduced, ...deps] },
  );
}
