import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function marqueeVelocity(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  text?: string;
  baseSpeed?: number;
}

export function ${pascal}({ text = "Velocity is a feeling — ", baseSpeed = 1 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (isReducedMotion) {
      timeline.from(track, { opacity: 0, duration: motion.dur.reveal, ease: ease("hero") });
      return;
    }
    timeline.to(track, {
      xPercent: -50,
      duration: motion.dur.ui * baseSpeed,
      ease: "none",
      repeat: -1,
    });
  }, [timeline, isReducedMotion, baseSpeed]);

  return (
    <div className="overflow-hidden whitespace-nowrap" data-axm-id="${item.name}">
      <div ref={trackRef} className="inline-flex">
        <span className="text-fluid-display text-text-primary pr-8">{text}</span>
        <span className="text-fluid-display text-text-primary pr-8">{text}</span>
      </div>
    </div>
  );
}
`,
  };
}
