import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";
import { weightBreathe } from "@/cli/generators/pattern-typo-weight.js";
import { marqueeVelocity } from "@/cli/generators/pattern-typo-marquee.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

function splitReveal(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect, useMemo } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  text?: string;
  staggerToken?: string;
}

function splitChars(text: string): string[] {
  return text.split("");
}

function resolveStagger(token: string): number {
  const parts = token.split(".");
  const target: Record<string, number> = motion.stagger;
  const key = parts[parts.length - 1];
  return key !== undefined && target[key] !== undefined ? target[key] : motion.stagger.chars;
}

export function ${pascal}({ text = "Distinction in motion", staggerToken = "motion.stagger.chars" }: Props) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const chars = useMemo(() => splitChars(text), [text]);
  const stagger = useMemo(() => resolveStagger(staggerToken), [staggerToken]);
  const { timeline, isReducedMotion, reducedMotionOptions } = useChoreo({
    id: "${item.name}",
    reducedMotion: "opacity-only",
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const targets = container.querySelectorAll("[data-char]");
    if (targets.length === 0) return;

    if (isReducedMotion && reducedMotionOptions.strategy === "opacity-only") {
      timeline.from(targets, {
        opacity: 0,
        duration: motion.dur.reveal * motion.reducedMotion.durFactor,
        stagger,
        ease: ease("hero"),
        scrollTrigger: { trigger: container, start: "top 80%" },
      });
      return;
    }

    timeline.from(targets, {
      y: "100%",
      opacity: 0,
      duration: motion.dur.reveal,
      stagger,
      ease: ease("hero"),
      scrollTrigger: { trigger: container, start: "top 80%" },
    });
  }, [timeline, isReducedMotion, reducedMotionOptions, stagger]);

  return (
    <h2 ref={containerRef} className="text-fluid-display text-text-primary" data-axm-id="${item.name}">
      {chars.map((char, index) => (
        <span key={index} className="inline-block overflow-hidden">
          <span data-char className="inline-block">
            {char === " " ? "\\u00A0" : char}
          </span>
        </span>
      ))}
    </h2>
  );
}
`,
  };
}

export function generateTypoPattern(item: PatternCatalogItem): { indexTsx: string } {
  if (item.name === "weight-breathe") return weightBreathe(item);
  if (item.name === "marquee-velocity") return marqueeVelocity(item);
  return splitReveal(item);
}
