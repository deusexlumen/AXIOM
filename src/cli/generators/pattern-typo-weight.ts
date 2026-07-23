import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function weightBreathe(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  text?: string;
  axisWght?: number[];
}

export function ${pascal}({ text = "Breathe", axisWght = [200, 900] }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });
  const min = axisWght[0] ?? 200;
  const max = axisWght[1] ?? 900;

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    if (isReducedMotion) {
      timeline.from(target, { opacity: 0, duration: motion.dur.reveal, ease: ease("hero") });
      return;
    }
    timeline.fromTo(
      target,
      { fontWeight: min },
      {
        fontWeight: max,
        duration: motion.dur.scene,
        ease: ease("drift"),
        yoyo: true,
        repeat: -1,
      },
    );
  }, [timeline, isReducedMotion, min, max]);

  return (
    <span
      ref={ref}
      className="text-fluid-display text-text-primary"
      style={{ fontVariationSettings: \`wght' \${min}\` }}
      data-axm-id="${item.name}"
    >
      {text}
    </span>
  );
}
`,
  };
}
