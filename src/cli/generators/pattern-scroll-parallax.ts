import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

interface Layer {
  speed: number;
  content: string;
}

export function parallaxStack(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Layer {
  speed: number;
  content: string;
}

interface Props {
  layers?: Layer[];
}

const defaultLayers: Layer[] = [
  { speed: 0.2, content: "Back layer" },
  { speed: 0.5, content: "Middle layer" },
  { speed: 1.0, content: "Front layer" },
];

export function ${pascal}({ layers = defaultLayers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { timeline } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const sheets = container.querySelectorAll("[data-parallax-layer]");
    if (sheets.length === 0) return;

    sheets.forEach((sheet, index) => {
      const layer = layers[index];
      if (!layer) return;
      timeline.fromTo(
        sheet,
        { yPercent: layer.speed * 20 },
        {
          yPercent: layer.speed * -20,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: motion.scroll.scrubDefault,
          },
        },
        0,
      );
    });
  }, [timeline, layers]);

  return (
    <section ref={containerRef} className="relative h-[200vh]" data-axm-id="${item.name}">
      {layers.map((layer, index) => (
        <div
          key={index}
          data-parallax-layer
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: index + 1 }}
        >
          <div className="rounded-radius-md bg-surface-raised px-12 py-8 text-fluid-display text-text-primary shadow-lg">
            {layer.content}
          </div>
        </div>
      ))}
    </section>
  );
}
`,
  };
}
