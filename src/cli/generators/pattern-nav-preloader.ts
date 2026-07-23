import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function preloaderCounter(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect, useState } from "react";
import { useChoreo, ease } from "@/core/useChoreo";
import { motion } from "@/generated/motion";

interface Props {
  label?: string;
}

export function ${pascal}({ label = "Loading" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    if (isReducedMotion) {
      setCount(100);
      setDone(true);
      return;
    }
    const obj = { value: 0 };
    timeline.to(obj, {
      value: 100,
      duration: motion.dur.reveal * 2,
      ease: ease("hero"),
      onUpdate: () => { setCount(Math.round(obj.value)); },
      onComplete: () => { setDone(true); },
    });
  }, [timeline, isReducedMotion]);

  return (
    <div
      ref={ref}
      className={\`fixed inset-0 z-50 flex items-center justify-center bg-surface-base transition-opacity duration-\${String(motion.dur.reveal)}s \${done ? "pointer-events-none opacity-0" : "opacity-100"}\`}
      data-axm-id="${item.name}"
    >
      <span className="text-fluid-display text-text-primary">{label} {count}%</span>
    </div>
  );
}
`,
  };
}
