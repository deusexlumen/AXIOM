import { useRef } from "react";
import { useChoreo } from "@/motion/useChoreo";
import { SCROLL } from "@/motion/tokens";

const PANELS = ["Schwere", "Licht", "Stille"];

export function PinnedNarrative() {
  const root = useRef<HTMLElement>(null);

  useChoreo((ctx) => {
    if (ctx.reduced) {
      ctx.gsap.set(root.current!.querySelectorAll("[data-panel]"), { autoAlpha: 1 });
      return;
    }
    const panels = root.current!.querySelectorAll("[data-panel]");
    const tl = ctx.gsap.timeline({
      scrollTrigger: {
        trigger: root.current,
        start: "top top",
        end: "+=300%",
        pin: true,
        scrub: SCROLL.scrubDefault,
      },
    });
    panels.forEach((p, i) => {
      if (i > 0) tl.fromTo(p, { autoAlpha: 0, yPercent: 8 }, { autoAlpha: 1, yPercent: 0 });
      if (i < panels.length - 1) tl.to(p, { autoAlpha: 0, yPercent: -8 });
    });
  }, [], root);

  return (
    <section ref={root} className="relative h-screen">
      {PANELS.map((label) => (
        <div
          key={label}
          data-panel
          className="invisible absolute inset-0 grid place-items-center font-display text-7xl text-[var(--color-accent)]"
        >
          {label}
        </div>
      ))}
    </section>
  );
}
