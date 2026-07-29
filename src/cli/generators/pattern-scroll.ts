import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";
import { horizontalDrift } from "@/cli/generators/pattern-scroll-horizontal.js";
import { parallaxStack } from "@/cli/generators/pattern-scroll-parallax.js";
import { sequenceScrub } from "@/cli/generators/pattern-scroll-sequence.js";

interface Section {
  title: string;
  body: string;
}

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

function pinnedNarrative(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Section {
  title: string;
  body: string;
}

interface Props {
  sections?: Section[];
}

const defaultSections: Section[] = [
  { title: "Chapter One", body: "Open with tension." },
  { title: "Chapter Two", body: "Build the argument." },
  { title: "Chapter Three", body: "Release into clarity." },
];

export function ${pascal}({ sections = defaultSections }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { timeline, isReducedMotion, reducedMotionOptions } = useChoreo({
    id: "${item.name}",
    reducedMotion: "opacity-only",
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll("[data-narrative-slide]");
    if (items.length === 0) return;

    timeline.set(items, { opacity: 0 });
    if (isReducedMotion && reducedMotionOptions.strategy === "opacity-only") {
      timeline.to(items, {
        opacity: 1,
        duration: motion.dur.reveal * motion.reducedMotion.durFactor,
        stagger: motion.stagger.items,
        ease: ease("hero"),
      });
      return;
    }

    items.forEach((item, index) => {
      const isFirst = index === 0;
      timeline.fromTo(
        item,
        { opacity: isFirst ? 1 : 0, yPercent: isFirst ? 0 : 20 },
        {
          opacity: 1,
          yPercent: 0,
          duration: motion.dur.reveal,
          ease: ease("hero"),
        },
        index * 0.3,
      );
    });

    timeline.scrollTrigger = {
      trigger: container,
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: motion.scroll.scrubDefault,
    };
  }, [timeline, isReducedMotion, reducedMotionOptions]);

  return (
    <section ref={containerRef} className="relative h-screen" data-axm-id="${item.name}">
      {sections.map((section, index) => (
        <div
          key={index}
          data-narrative-slide
          className="absolute inset-0 flex flex-col justify-center px-8"
        >
          <h2 className="text-fluid-display text-text-primary">{section.title}</h2>
          <p className="mt-4 text-fluid-body text-text-muted">{section.body}</p>
        </div>
      ))}
    </section>
  );
}
`,
  };
}

export function generateScrollPattern(item: PatternCatalogItem): { indexTsx: string } {
  if (item.name === "horizontal-drift") return horizontalDrift(item);
  if (item.name === "parallax-stack") return parallaxStack(item);
  if (item.name === "sequence-scrub") return sequenceScrub(item);
  return pinnedNarrative(item);
}
