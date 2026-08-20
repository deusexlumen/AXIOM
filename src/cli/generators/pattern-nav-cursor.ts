import type { PatternCatalogItem } from "@/cli/schemas/pattern.js";

function toPascal(name: string): string {
  return name.replace(/(^|-)([a-z])/g, (_match: string, _sep: string, letter: string) => letter.toUpperCase());
}

export function cursorSystem(item: PatternCatalogItem): { indexTsx: string } {
  const pascal = toPascal(item.name);
  return {
    indexTsx: `"use client";
import { useRef, useEffect, useState } from "react";
import { useChoreo } from "@/core/useChoreo";

interface Props {
  blendMode?: string;
}

export function ${pascal}({ blendMode = "difference" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { isReducedMotion } = useChoreo({ id: "${item.name}", reducedMotion: "instant" });

  useEffect(() => {
    if (isReducedMotion) return;
    const move = (e: MouseEvent) => { setPos({ x: e.clientX, y: e.clientY }); };
    window.addEventListener("mousemove", move);
    return () => { window.removeEventListener("mousemove", move); };
  }, [isReducedMotion]);

  if (isReducedMotion) return null;
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-40 h-4 w-4 rounded-radius-full bg-action-primary"
      style={{ left: pos.x, top: pos.y, mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"] }}
      data-axm-id="${item.name}"
    />
  );
}
`,
  };
}
