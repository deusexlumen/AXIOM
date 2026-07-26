import { useRef, useState } from "react";
import { useChoreo } from "@/motion/useChoreo";

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);

  useChoreo((ctx) => {
    const counter = { v: 0 };
    const tl = ctx.gsap.timeline({ onComplete: onDone });
    tl.to(counter, {
      v: 100,
      duration: ctx.dur("scene"),
      ease: ctx.ease("drift"),
      onUpdate: () => setCount(Math.round(counter.v)),
    });
    if (ctx.reduced) {
      tl.to(root.current, { autoAlpha: 0, duration: ctx.dur("ui") });
    } else {
      tl.to(root.current, { yPercent: -100, duration: ctx.dur("reveal"), ease: ctx.ease("hero") });
    }
  }, [], root);

  return (
    <div ref={root} className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-void)]">
      <span className="font-display text-6xl tabular-nums text-[var(--color-light)]">{count}</span>
    </div>
  );
}
