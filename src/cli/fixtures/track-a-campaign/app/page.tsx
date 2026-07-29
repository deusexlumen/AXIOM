"use client";

import { DistortionMedia } from "@/patterns/distortion-media";
import { MagneticCta } from "@/patterns/magnetic-cta";
import { MarqueeVelocity } from "@/patterns/marquee-velocity";
import { PreloaderCounter } from "@/patterns/preloader-counter";
import { SplitReveal } from "@/patterns/split-reveal";

export default function HomePage() {
  return (
    <main data-axm-id="campaign">
      <PreloaderCounter label="Launch" />

      <section className="relative min-h-screen overflow-hidden bg-surface-base">
        <DistortionMedia intensity={0.4} rgbShift={0.002} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-end p-space-6 pb-space-12">
          <SplitReveal text="Curated Motion" />
          <p className="mt-space-4 max-w-md text-lg text-text-muted">
            A neon campaign for the next launch.
          </p>
        </div>
      </section>

      <section className="bg-bg-primary py-space-16">
        <MarqueeVelocity text="Velocity is a feeling — " baseSpeed={1.2} />
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-space-8 bg-surface-raised px-space-6 text-center">
        <SplitReveal text="Ready to launch?" />
        <MagneticCta strength={0.35} />
      </section>

      <section className="bg-surface-base px-space-6 py-space-16">
        <h2 className="text-display text-text-primary">Contact</h2>
        <a
          href="mailto:hello@axiom.studio"
          className="mt-space-4 inline-block text-lg text-action-primary hover:text-text-primary"
        >
          hello@axiom.studio
        </a>
      </section>
    </main>
  );
}
