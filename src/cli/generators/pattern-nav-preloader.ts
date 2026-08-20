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
  const countRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);
  const { timeline, isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "opacity-only" });

  useEffect(() => {
    const target = ref.current;
    if (!target) return;
    const write = (value: number) => {
      const node = countRef.current;
      if (node) node.textContent = \`\${String(value)}%\`;
    };
    if (isReducedMotion) {
      write(100);
      setDone(true);
      return;
    }
    const obj = { value: 0 };
    timeline.to(obj, {
      value: 100,
      duration: motion.dur.reveal * 2,
      ease: ease("hero"),
      // Written straight to the DOM: routing this through setState re-rendered
      // a full-viewport overlay on every tick, which the perf gate attributed
      // to this pattern once the overlay actually covered the viewport.
      onUpdate: () => { write(Math.round(obj.value)); },
      onComplete: () => { setDone(true); },
    });
  }, [timeline, isReducedMotion]);

  return (
    <div
      ref={ref}
      className={\`fixed inset-0 z-50 flex items-center justify-center bg-surface-base transition-opacity \${done ? "pointer-events-none opacity-0" : "opacity-100"}\`}
      // Inline, not a duration-* class: the value is dynamic, and Tailwind only
      // sees class names that appear literally in the source.
      style={{ transitionDuration: \`\${String(Math.round(motion.dur.reveal * 1000))}ms\` }}
      data-axm-id="${item.name}"
    >
      <span className="text-fluid-display text-text-primary">
        {label} <span ref={countRef}>0%</span>
      </span>
    </div>
  );
}
`,
  };
}
