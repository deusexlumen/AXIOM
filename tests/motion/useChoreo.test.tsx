import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useChoreo } from "@/motion/useChoreo";
import { DUR, REDUCED } from "@/motion/tokens";

vi.mock("@/motion/useReducedMotion", () => ({ useReducedMotion: () => true }));

function Probe({ onDur }: { onDur: (d: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useChoreo((ctx) => { onDur(ctx.dur("reveal")); }, [], ref);
  return <div ref={ref} />;
}

describe("useChoreo", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", () => ({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  it("shortens duration under reduced motion", () => {
    let seen = 0;
    render(<Probe onDur={(d) => (seen = d)} />);
    expect(seen).toBeCloseTo(DUR.reveal * REDUCED.durFactor);
  });
});
