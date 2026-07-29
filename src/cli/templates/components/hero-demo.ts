export function heroDemoTsx(): string {
  return `"use client";

import { useChoreo } from "@/core/useChoreo";

export function HeroDemo() {
  const { isReducedMotion } = useChoreo({
    id: "hero-demo",
    reducedMotion: "opacity-only",
  });

  return (
    <div
      data-axm-id="HeroDemo"
      className={isReducedMotion ? "opacity-100" : "translate-y-0 opacity-100"}
    >
      <p className="text-2xl font-bold">ATELIER reduced-motion demo</p>
    </div>
  );
}
`;
}
