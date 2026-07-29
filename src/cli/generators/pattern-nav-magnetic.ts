import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function magneticCta(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  strength?: number;
}

export function ${pascal}({ strength = 0.4 }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "instant" });

  useEffect(() => {
    const button = ref.current;
    if (!button || isReducedMotion) return;
    const move = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      timeline.to(button, { x, y, duration: motion.dur.micro, ease: ease("snap") });
    };
    const leave = () => {
      timeline.to(button, { x: 0, y: 0, duration: motion.dur.ui, ease: ease("snap") });
    };
    button.addEventListener("mousemove", move);
    button.addEventListener("mouseleave", leave);
    return () => {
      button.removeEventListener("mousemove", move);
      button.removeEventListener("mouseleave", leave);
    };
  }, [timeline, isReducedMotion, strength]);

  return (
    <button
      ref={ref}
      type="button"
      className="rounded-radius-full bg-action-primary px-8 py-4 text-fluid-body font-medium text-text-primary"
      data-axm-id="${item.name}"
    >
      Explore
    </button>
  );
}
`,
  };
}
