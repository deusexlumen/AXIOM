import { useRef } from "react";
import { useChoreo } from "@/motion/useChoreo";
import { SplitText } from "@/motion/gsap";
import { STAGGER } from "@/motion/tokens";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useChoreo((ctx) => {
    const h = root.current!.querySelector("h1")!;
    if (ctx.reduced) {
      ctx.gsap.set(h, { autoAlpha: 1 });
      return;
    }
    const split = new SplitText(h, { type: "lines", linesClass: "line" });
    ctx.gsap.set(h, { autoAlpha: 1 });
    ctx.gsap.from(split.lines, {
      yPercent: 120,
      duration: ctx.dur("reveal"),
      ease: ctx.ease("hero"),
      stagger: STAGGER.lines,
    });
  }, [], root);

  return (
    <section ref={root} className="relative grid h-screen place-items-center px-8">
      <h1 className="invisible max-w-5xl font-display text-6xl leading-[1.05] md:text-8xl">
        Monolith im Nebel
      </h1>
    </section>
  );
}
