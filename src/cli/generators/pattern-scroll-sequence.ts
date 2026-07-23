import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function sequenceScrub(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  frames?: number;
}

export function ${pascal}({ frames = 60 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;
    if (!container || !frame) return;
    if (isReducedMotion) {
      frame.textContent = "Frame 1";
      return;
    }
    timeline.to(frame, {
      motionValue: frames,
      duration: motion.dur.scene,
      ease: "none",
      snap: { motionValue: 1 },
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: motion.scroll.scrubDefault,
        onUpdate: (self) => {
          const index = Math.min(frames, Math.max(1, Math.floor(self.progress * frames) + 1));
          frame.textContent = \`Frame \${index}\`;
        },
      },
    });
  }, [timeline, isReducedMotion, frames]);

  return (
    <section ref={containerRef} className="relative h-screen" data-axm-id="${item.name}">
      <div
        ref={frameRef}
        className="absolute inset-0 flex items-center justify-center text-fluid-display text-text-primary"
      >
        Frame 1
      </div>
    </section>
  );
}
`,
  };
}
