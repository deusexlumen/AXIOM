import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

interface DriftItem {
  title: string;
  image: string;
}

export function horizontalDrift(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface DriftItem {
  title: string;
  image: string;
}

interface Props {
  items?: DriftItem[];
}

const defaultItems: DriftItem[] = [
  { title: "Drift One", image: "/drift-1.jpg" },
  { title: "Drift Two", image: "/drift-2.jpg" },
  { title: "Drift Three", image: "/drift-3.jpg" },
];

export function ${pascal}({ items = defaultItems }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { timeline } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const panels = track.querySelectorAll("[data-drift-panel]");
    if (panels.length === 0) return;

    timeline.to(track, {
      xPercent: -100 * (panels.length - 1),
      duration: motion.dur.scene,
      ease: ease("drift"),
      scrollTrigger: {
        trigger: track,
        start: "top top",
        end: "+=200%",
        pin: true,
        scrub: motion.scroll.scrubDefault,
      },
    });
  }, [timeline]);

  return (
    <section className="h-screen overflow-hidden" data-axm-id="${item.name}">
      <div ref={trackRef} className="flex h-full w-fit">
        {items.map((item, index) => (
          <div
            key={index}
            data-drift-panel
            className="flex h-screen w-screen flex-shrink-0 items-center justify-center bg-surface-raised"
          >
            <div className="text-center">
              <img src={item.image} alt={item.title} className="mx-auto mb-4 h-48 w-48 object-cover" />
              <h2 className="text-fluid-display text-text-primary">{item.title}</h2>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
`,
  };
}
