export function layoutTsx(projectName: string): string {
  return `import type { ReactNode } from "react";
import "@/generated/theme.css";
import "./globals.css";

export const metadata = {
  title: "${projectName}",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

export function pageTsx(): string {
  return `"use client";

import { useEffect, useRef } from "react";
import { useChoreo } from "@/core/useChoreo";
import { Stage } from "@/core/Stage";
import { QuadMesh } from "@/core/QuadMesh";
import { useLenis } from "@/core/lenis";
import { motion } from "@/generated/motion";

export default function HomePage() {
  const sectionRef = useRef<HTMLElement>(null);
  const { timeline, isReducedMotion } = useChoreo({ id: "hero" });
  useLenis();

  useEffect(() => {
    if (isReducedMotion || sectionRef.current === null) return;
    timeline.fromTo(
      sectionRef.current,
      { opacity: 0.5 },
      {
        opacity: 1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=500",
          pin: true,
          scrub: motion.scroll.scrubDefault,
        },
      },
    );
    return () => {
      timeline.kill();
    };
  }, [timeline, isReducedMotion]);

  return (
    <main>
      <section
        ref={sectionRef}
        data-axm-id="hero"
        className="relative h-screen w-full"
      >
        <Stage className="absolute inset-0">
          <QuadMesh />
        </Stage>
        <h1 className="absolute bottom-8 left-8 text-4xl font-bold">
          ATELIER A0
        </h1>
      </section>
      <section data-axm-id="spacer" className="h-screen" />
    </main>
  );
}
`;
}

export function globalsCss(): string {
  return `@import "tailwindcss";
@import "../src/generated/theme.css";

@layer base {
  body {
    background-color: var(--color-surface-base);
    color: var(--color-text-primary);
  }
}
`;
}
