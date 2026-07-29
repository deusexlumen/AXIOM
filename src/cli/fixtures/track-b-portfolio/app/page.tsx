"use client";

import { CursorSystem } from "@/patterns/cursor-system";
import { DepthGallery } from "@/patterns/depth-gallery";
import { FlowmapHero } from "@/patterns/flowmap-hero";
import { PageMaskTransition } from "@/patterns/page-mask-transition";
import { SplitReveal } from "@/patterns/split-reveal";

export default function HomePage() {
  return (
    <main data-axm-id="portfolio">
      <CursorSystem blendMode="difference" />
      <PageMaskTransition grammar="mask-wipe-up" />

      <section className="relative min-h-screen overflow-hidden bg-surface-base">
        <FlowmapHero trailStrength={0.35} dissipation={0.9} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end p-space-6 pb-space-12">
          <SplitReveal text="Studio Obscura" />
          <p className="mt-space-4 max-w-md text-lg text-text-muted">
            Digital craft in the fog.
          </p>
        </div>
      </section>

      <section className="bg-surface-raised px-space-6 py-space-24">
        <SplitReveal text="Selected Work" />
        <div className="mt-space-12">
          <DepthGallery items={["Aurora", "Monolith", "Veil", "Drift"]} />
        </div>
      </section>

      <section className="bg-surface-base px-space-6 py-space-24">
        <SplitReveal text="About" />
        <p className="mt-space-6 max-w-2xl text-text-muted">
          We build immersive websites for design-led brands. No templates. No shortcuts.
        </p>
      </section>

      <section className="bg-surface-raised px-space-6 py-space-16">
        <h2 className="text-display text-text-primary">Contact</h2>
        <a
          href="mailto:hello@studioobscura.dev"
          className="mt-space-4 inline-block text-lg text-action-primary hover:text-text-primary"
        >
          hello@studioobscura.dev
        </a>
      </section>
    </main>
  );
}
