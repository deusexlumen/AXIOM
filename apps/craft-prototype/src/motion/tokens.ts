export const EASE = {
  hero: [0.16, 1, 0.3, 1],
  snap: [0.83, 0, 0.17, 1],
  drift: [0.25, 0.1, 0.25, 1],
} as const satisfies Record<string, [number, number, number, number]>;

export const DUR = { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 } as const;
export const STAGGER = { chars: 0.018, lines: 0.08, items: 0.12 } as const;
export const SCROLL = { lerp: 0.09, scrubDefault: 0.8 } as const;
export const REDUCED = { strategy: "opacity-only", durFactor: 0.5 } as const;

export function cssEase(name: keyof typeof EASE): string {
  const [a, b, c, d] = EASE[name];
  return `cubic-bezier(${a},${b},${c},${d})`;
}
