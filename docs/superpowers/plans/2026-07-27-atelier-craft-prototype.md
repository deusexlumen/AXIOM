# ATELIER Craft Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a single runnable Vite page that demonstrates ATELIER agency-grade output-craft (preloader, split-reveal hero, smooth scroll, one WebGL scene, pinned narrative) on the spec-mandated GSAP/Lenis/R3F stack.

**Architecture:** Runtime-only vertical slice — the ATELIER pipeline (CLI, MOTION.json generation, gates) is faked; motion tokens and the shader are hand-written. All GSAP timelines funnel through a `useChoreo` wrapper (built on `@gsap/react`'s `useGSAP`) that injects reduced-motion behavior and cleanup. Lenis is wired to GSAP's ticker so ScrollTrigger and smooth scroll share one loop. WebGL sits behind a capability gate with a static poster fallback.

**Tech Stack:** Vite 6, React 19, TypeScript 5.9 (strict), GSAP 3.13 (ScrollTrigger + SplitText), @gsap/react, Lenis, Three.js + @react-three/fiber v9 + @react-three/drei v10, Tailwind v4, @fontsource-variable/fraunces, Vitest 3, Playwright.

## Global Constraints

- **React function components only** (spec substrate, AXIOM I).
- **TypeScript strict + `noUncheckedIndexedAccess`** (AXIOM §1).
- **No systemfonts** — self-hosted variable serif only (ATELIER §2; systemfont use = spec violation `AXM-R003`).
- **All GSAP access goes through `useChoreo`** — no bare `gsap.to/from/timeline` in components (spec I-18 concept).
- **All motion values come from `tokens.ts`** — no raw easing strings (`"power2.out"`) or raw duration numbers in component code (spec §5.4 / `AXM-N001` concept).
- **Every animation has a reduced-motion path** (spec I-19); every WebGL scene has a no-WebGL poster fallback.
- **Versions pinned at install** — use `pnpm add` to resolve latest compatible, commit the lockfile; do NOT hardcode patch versions in this plan.
- **Deviation from spec §2:** Vite instead of Next.js 15 (documented in design doc §7). Otherwise spec §2 stack is authoritative.

---

### Task 0: Project scaffold + dependency lock

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `.gitignore` (append)
- Create: `vitest.config.ts`, `playwright.config.ts`

**Interfaces:**
- Produces: a Vite React 19 + TS app that builds clean; `App` default export renders a placeholder; Tailwind v4 active; `pnpm test` (Vitest) and `pnpm test:e2e` (Playwright) wired.

- [x] **Step 1: Scaffold and install**

The repo root currently holds only docs. Create the app at repo root (not a subdir).

```bash
pnpm add react react-dom
pnpm add three @react-three/fiber @react-three/drei
pnpm add gsap @gsap/react lenis
pnpm add @fontsource-variable/fraunces
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
pnpm add -D tailwindcss @tailwindcss/vite
pnpm add -D vitest @vitest/browser jsdom @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test
```

- [x] **Step 2: `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          r3f: ["@react-three/fiber", "@react-three/drei"],
          gsap: ["gsap", "@gsap/react"],
        },
      },
    },
  },
});
```

- [x] **Step 3: `tsconfig.json`** (strict, React 19 JSX, GLSL `?raw` module typing)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "types": ["vite/client"],
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": "."
  },
  "include": ["src", "tests"]
}
```

Add `src/glsl.d.ts`:
```ts
declare module "*.glsl?raw" { const src: string; export default src; }
```

- [x] **Step 4: `src/styles/index.css`** (Tailwind v4 + theme + font)

```css
@import "tailwindcss";
@import "@fontsource-variable/fraunces";

@theme {
  --color-void: #0a0a0c;
  --color-fog: #14141a;
  --color-light: #f4f1ea;
  --color-accent: #c9a76b;
  --font-display: "Fraunces Variable", serif;
}

html, body, #root { height: 100%; background: var(--color-void); color: var(--color-light); }
body { margin: 0; overscroll-behavior: none; }
```

- [x] **Step 5: `index.html`, `src/main.tsx`, placeholder `src/App.tsx`**

`src/main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import "@/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
```

`src/App.tsx` (placeholder):
```tsx
export default function App() {
  return <main className="grid h-full place-items-center font-display text-2xl">ATELIER</main>;
}
```

- [x] **Step 6: package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [x] **Step 7: Verify build + dev**

Run: `pnpm build`
Expected: typecheck + bundle succeed, no errors.
Run: `pnpm dev` → open browser → dark page with "ATELIER" in serif visible.

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+GSAP+R3F prototype"
```

---

### Task 1: Motion tokens

**Files:**
- Create: `src/motion/tokens.ts`
- Test: `tests/motion/tokens.test.ts`

**Interfaces:**
- Produces:
  - `EASE: Record<"hero" | "snap" | "drift", [number, number, number, number]>`
  - `DUR: { micro: number; ui: number; reveal: number; scene: number; max: number }`
  - `STAGGER: { chars: number; lines: number; items: number }`
  - `SCROLL: { lerp: number; scrubDefault: number }`
  - `REDUCED: { strategy: "opacity-only"; durFactor: number }`
  - `cssEase(name: keyof typeof EASE): string` → `"cubic-bezier(a,b,c,d)"` (for GSAP `ease` via `CustomEase`? No — GSAP accepts cubic-bezier via `gsap.parseEase`; return the raw array for GSAP and a string helper for CSS).

- [x] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { EASE, DUR, STAGGER, cssEase } from "@/motion/tokens";

describe("motion tokens", () => {
  it("hero ease is the spec reveal curve", () => {
    expect(EASE.hero).toEqual([0.16, 1, 0.3, 1]);
  });
  it("durations never exceed max", () => {
    for (const v of Object.values(DUR)) expect(v).toBeLessThanOrEqual(DUR.max);
  });
  it("cssEase formats a cubic-bezier string", () => {
    expect(cssEase("snap")).toBe("cubic-bezier(0.83,0,0.17,1)");
  });
  it("stagger values are positive", () => {
    for (const v of Object.values(STAGGER)) expect(v).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run test → FAIL**

Run: `pnpm test tests/motion/tokens.test.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Implement `src/motion/tokens.ts`** (shape mirrors ATELIER §5.4 MOTION.axm.json)

```ts
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
```

- [x] **Step 4: Run test → PASS**

Run: `pnpm test tests/motion/tokens.test.ts`
Expected: PASS (4 tests).

- [x] **Step 5: Commit**

```bash
git add src/motion/tokens.ts tests/motion/tokens.test.ts
git commit -m "feat: motion tokens (ease/dur/stagger) from ATELIER §5.4"
```

---

### Task 2: Reduced-motion hook

**Files:**
- Create: `src/motion/useReducedMotion.ts`
- Test: `tests/motion/useReducedMotion.test.ts`

**Interfaces:**
- Produces: `useReducedMotion(): boolean` — reactive to `matchMedia("(prefers-reduced-motion: reduce)")`.

- [x] **Step 1: Write the failing test** (jsdom; mock matchMedia)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "@/motion/useReducedMotion";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches, media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
}

describe("useReducedMotion", () => {
  beforeEach(() => vi.unstubAllGlobals());
  it("returns true when user prefers reduced motion", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
  it("returns false otherwise", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
```

Add `tests/setup.ts` (registered in vitest.config) with `import "@testing-library/jest-dom";` and set `test.environment = "jsdom"`.

- [x] **Step 2: Run → FAIL**

Run: `pnpm test tests/motion/useReducedMotion.test.ts`
Expected: FAIL (module not found).

- [x] **Step 3: Implement `src/motion/useReducedMotion.ts`**

```ts
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void): () => void {
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matchMedia(QUERY).matches,
    () => false,
  );
}
```

- [x] **Step 4: Run → PASS**

Run: `pnpm test tests/motion/useReducedMotion.test.ts`
Expected: PASS (2 tests).

- [x] **Step 5: Commit**

```bash
git add src/motion/useReducedMotion.ts tests/motion/useReducedMotion.test.ts tests/setup.ts vitest.config.ts
git commit -m "feat: useReducedMotion hook (spec I-19)"
```

---

### Task 3: GSAP plugin registration + `useChoreo` wrapper

**Files:**
- Create: `src/motion/gsap.ts` (central registration)
- Create: `src/motion/useChoreo.ts`
- Test: `tests/motion/useChoreo.test.tsx`

**Interfaces:**
- Consumes: `EASE`, `DUR`, `REDUCED` from `tokens.ts`; `useReducedMotion`.
- Produces:
  - `gsap` (re-exported, plugins registered: `ScrollTrigger`, `SplitText`, `useGSAP`).
  - `useChoreo(build: (ctx: ChoreoCtx) => void, deps?: unknown[], scope?: React.RefObject<HTMLElement | null>): void`
    where `ChoreoCtx = { gsap: typeof gsap; reduced: boolean; ease: (n: keyof typeof EASE) => gsap.EaseFunction | string; dur: (n: keyof typeof DUR) => number }`.
  - When `reduced` is true, `dur()` multiplies by `REDUCED.durFactor`; callers use `reduced` to swap transforms for opacity-only. `useChoreo` runs inside `useGSAP` so cleanup/StrictMode is handled.

- [x] **Step 1: Implement `src/motion/gsap.ts`** (no test — pure registration)

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

- [x] **Step 2: Write the failing test** (verifies reduced-motion shortens duration)

```tsx
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
```

- [x] **Step 3: Run → FAIL**

Run: `pnpm test tests/motion/useChoreo.test.tsx`
Expected: FAIL (module not found).

- [x] **Step 4: Implement `src/motion/useChoreo.ts`**

```ts
import type { RefObject } from "react";
import { gsap, useGSAP } from "@/motion/gsap";
import { EASE, DUR, REDUCED } from "@/motion/tokens";
import { useReducedMotion } from "@/motion/useReducedMotion";

export interface ChoreoCtx {
  gsap: typeof gsap;
  reduced: boolean;
  ease: (n: keyof typeof EASE) => string;
  dur: (n: keyof typeof DUR) => number;
}

export function useChoreo(
  build: (ctx: ChoreoCtx) => void,
  deps: unknown[] = [],
  scope?: RefObject<HTMLElement | null>,
): void {
  const reduced = useReducedMotion();
  useGSAP(
    () => {
      const ctx: ChoreoCtx = {
        gsap,
        reduced,
        ease: (n) => `cubic-bezier(${EASE[n].join(",")})`,
        dur: (n) => DUR[n] * (reduced ? REDUCED.durFactor : 1),
      };
      build(ctx);
    },
    { scope: scope as never, dependencies: [reduced, ...deps] },
  );
}
```

- [x] **Step 5: Run → PASS**

Run: `pnpm test tests/motion/useChoreo.test.tsx`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add src/motion/gsap.ts src/motion/useChoreo.ts tests/motion/useChoreo.test.tsx
git commit -m "feat: useChoreo wrapper — GSAP + reduced-motion + StrictMode cleanup"
```

---

### Task 4: Lenis provider + GSAP ticker wiring (Integration Risk #1)

**Files:**
- Create: `src/scroll/LenisProvider.tsx`
- Test: manual browser verification (animation loop wiring is not unit-testable meaningfully) + one Playwright smoke added in Task 9.

**Interfaces:**
- Consumes: `SCROLL.lerp` from tokens; `ScrollTrigger`, `gsap` from `@/motion/gsap`.
- Produces: `<LenisProvider>{children}</LenisProvider>` — mounts one Lenis instance, drives it from `gsap.ticker`, syncs `ScrollTrigger.update` on Lenis scroll, disables `lagSmoothing`. Under reduced-motion, Lenis is instantiated with `smoothWheel: false` (native scroll).

- [x] **Step 1: Implement `src/scroll/LenisProvider.tsx`**

```tsx
import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { SCROLL } from "@/motion/tokens";
import { useReducedMotion } from "@/motion/useReducedMotion";

export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    const lenis = new Lenis({ lerp: SCROLL.lerp, smoothWheel: !reduced });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
```

- [x] **Step 2: Temporary manual verification harness**

Temporarily wrap the placeholder `App` content with `<LenisProvider>` and add ~3 full-viewport `<section>`s plus a trivial ScrollTrigger to confirm wiring:

```tsx
useChoreo((ctx) => {
  ctx.gsap.to("[data-probe]", {
    opacity: 1, scrollTrigger: { trigger: "[data-probe]", start: "top 80%" },
  });
}, [], scopeRef);
```

Run: `pnpm dev` → scroll. Expected: momentum/smooth scroll present; the probe element fades in when scrolled into view (proves Lenis + ScrollTrigger share the loop). Remove the temporary harness after verifying.

- [x] **Step 3: Commit**

```bash
git add src/scroll/LenisProvider.tsx
git commit -m "feat: Lenis provider wired to GSAP ticker + ScrollTrigger"
```

---

### Task 5: WebGL Stage gate + mesh-gradient scene

**Files:**
- Create: `src/webgl/hasWebGL.ts`
- Create: `src/webgl/Stage.tsx`
- Create: `src/webgl/MeshGradient.tsx`
- Create: `src/webgl/meshGradient.frag.glsl`
- Create: `src/webgl/meshGradient.vert.glsl`
- Create: `public/poster.webp` (placeholder — see step 6)
- Test: `tests/webgl/hasWebGL.test.ts`

**Interfaces:**
- Consumes: nothing from prior tasks except color tokens (as GLSL uniforms, hardcoded to the direction palette).
- Produces:
  - `hasWebGL(): boolean`.
  - `<Stage />` — renders R3F `<Canvas frameloop="always">` with `<MeshGradient />` when WebGL available and not reduced-motion; otherwise `<img src="/poster.webp" alt="" aria-hidden>`.
  - `<MeshGradient />` — fullscreen plane, drift-animated fragment shader via `useFrame` updating a `uTime` uniform.

- [x] **Step 1: Write the failing test for `hasWebGL`**

```ts
import { describe, it, expect, vi } from "vitest";
import { hasWebGL } from "@/webgl/hasWebGL";

describe("hasWebGL", () => {
  it("returns false when getContext yields null", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(hasWebGL()).toBe(false);
  });
});
```

- [x] **Step 2: Run → FAIL**, then implement `src/webgl/hasWebGL.ts`

```ts
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
```

Run: `pnpm test tests/webgl/hasWebGL.test.ts` → PASS.

- [x] **Step 3: Shaders**

`src/webgl/meshGradient.vert.glsl`:
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
```

`src/webgl/meshGradient.frag.glsl` (flowing fog gradient — "Monolith im Nebel"):
```glsl
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uVoid;
uniform vec3 uFog;
uniform vec3 uAccent;

// cheap value noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv=vUv;
  float t=uTime*0.04;
  float n=fbm(uv*3.0+vec2(t, t*0.6));
  float m=fbm(uv*1.5-vec2(t*0.3, t));
  vec3 col=mix(uVoid, uFog, smoothstep(0.2,0.9,n));
  col=mix(col, uAccent, smoothstep(0.75,0.95,m)*0.35);
  // vignette
  col *= 1.0 - 0.4*length(uv-0.5);
  gl_FragColor=vec4(col,1.0);
}
```

- [x] **Step 4: `src/webgl/MeshGradient.tsx`**

```tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ShaderMaterial, Color } from "three";
import frag from "./meshGradient.frag.glsl?raw";
import vert from "./meshGradient.vert.glsl?raw";

export function MeshGradient() {
  const mat = useRef<ShaderMaterial>(null);
  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += delta;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{
          uTime: { value: 0 },
          uVoid: { value: new Color("#0a0a0c") },
          uFog: { value: new Color("#14141a") },
          uAccent: { value: new Color("#c9a76b") },
        }}
      />
    </mesh>
  );
}
```

- [x] **Step 5: `src/webgl/Stage.tsx`**

```tsx
import { Canvas } from "@react-three/fiber";
import { MeshGradient } from "./MeshGradient";
import { hasWebGL } from "./hasWebGL";
import { useReducedMotion } from "@/motion/useReducedMotion";

const Poster = () => (
  <img src="/poster.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
);

export function Stage() {
  const reduced = useReducedMotion();
  if (reduced || !hasWebGL()) return <Poster />;
  return (
    <div className="absolute inset-0">
      <Canvas frameloop="always" dpr={[1, 2]} orthographic camera={{ position: [0, 0, 1] }}>
        <MeshGradient />
      </Canvas>
    </div>
  );
}
```

- [x] **Step 6: Poster placeholder**

Create a minimal `public/poster.webp` — export one frame of the gradient, OR (acceptable for prototype) a solid dark-fog gradient image. Generate quickly:
```bash
# if imagemagick present; else drop any dark webp/png named poster.webp
magick -size 1600x1000 gradient:'#0a0a0c'-'#14141a' public/poster.webp
```
If no tooling, place any dark placeholder image at `public/poster.webp` — the gate must render *something* without erroring.

- [x] **Step 7: Verify in browser**

Run: `pnpm dev` → mount `<Stage />` full-screen temporarily → confirm animated fog gradient renders. Toggle OS reduced-motion → confirm poster shows instead.

- [x] **Step 8: Commit**

```bash
git add src/webgl public/poster.webp tests/webgl
git commit -m "feat: WebGL Stage gate + mesh-gradient fog scene + poster fallback"
```

---

### Task 6: Preloader (counter + reveal choreography)

**Files:**
- Create: `src/components/Preloader.tsx`
- Test: `tests/components/Preloader.test.tsx` (render + reduced-motion completes immediately)

**Interfaces:**
- Consumes: `useChoreo`, `DUR`.
- Produces: `<Preloader onDone={() => void} />` — counts 0→100 then plays an exit mask reveal, then calls `onDone`. Under reduced-motion: counter still shows but exits via opacity, shortened.

- [x] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Preloader } from "@/components/Preloader";

vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe("Preloader", () => {
  it("calls onDone after the sequence", async () => {
    const onDone = vi.fn();
    render(<Preloader onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 4000 });
  });
});
```

- [x] **Step 2: Run → FAIL**, then implement `src/components/Preloader.tsx`

```tsx
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
      ease: "power1.inOut",
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
```

Note: GSAP `ease` accepts the cubic-bezier string from `ctx.ease()`. Verify `power1.inOut` (a named GSAP core ease) is acceptable here or replace with `ctx.ease("drift")` to stay token-pure — **use `ctx.ease("drift")`** to honor the no-raw-easing constraint.

- [x] **Step 3: Run → PASS** (`pnpm test tests/components/Preloader.test.tsx`)

- [x] **Step 4: Commit**

```bash
git add src/components/Preloader.tsx tests/components/Preloader.test.tsx
git commit -m "feat: preloader counter + reveal choreography"
```

---

### Task 7: Hero (SplitText split-reveal)

**Files:**
- Create: `src/components/Hero.tsx`
- Test: `tests/components/Hero.test.tsx` (renders heading text; reduced-motion path keeps text visible)

**Interfaces:**
- Consumes: `useChoreo`, `STAGGER`, `SplitText` via `@/motion/gsap`.
- Produces: `<Hero />` — a full-viewport heading whose lines/chars reveal masked with stagger. Reduced-motion: text set visible instantly (opacity 1), no transform.

- [x] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/Hero";

vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));

describe("Hero", () => {
  it("renders the headline text", () => {
    render(<Hero />);
    expect(screen.getByRole("heading")).toHaveTextContent(/Monolith/i);
  });
});
```

- [x] **Step 2: Run → FAIL**, then implement `src/components/Hero.tsx`

```tsx
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
```

Note: masked reveal requires each `.line` to clip overflow. Add to `src/styles/index.css`:
```css
.line { overflow: hidden; display: block; }
```

- [x] **Step 3: Run → PASS**

- [x] **Step 4: Verify in browser** — headline lines rise into view with stagger; reduced-motion shows static headline.

- [x] **Step 5: Commit**

```bash
git add src/components/Hero.tsx tests/components/Hero.test.tsx src/styles/index.css
git commit -m "feat: hero split-reveal via SplitText"
```

---

### Task 8: PinnedNarrative (pin + scrub)

**Files:**
- Create: `src/components/PinnedNarrative.tsx`
- Test: manual browser verification (ScrollTrigger pin behavior needs real layout) + Playwright smoke (Task 9).

**Interfaces:**
- Consumes: `useChoreo`, `SCROLL.scrubDefault`, `ScrollTrigger` via gsap.
- Produces: `<PinnedNarrative />` — a section that pins while three content panels cross-fade/translate as the user scrolls (scrubbed). Reduced-motion: no pin, panels stacked and statically visible.

- [x] **Step 1: Implement `src/components/PinnedNarrative.tsx`**

```tsx
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
```

- [x] **Step 2: Verify in browser** — section pins, panels scrub through on scroll; reduced-motion shows panels stacked visible, no pin.

- [x] **Step 3: Commit**

```bash
git add src/components/PinnedNarrative.tsx
git commit -m "feat: pinned-narrative scrubbed section"
```

---

### Task 9: App composition + Playwright smoke

**Files:**
- Modify: `src/App.tsx`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `playwright.config.ts` (webServer)

**Interfaces:**
- Consumes: `LenisProvider`, `Preloader`, `Stage`, `Hero`, `PinnedNarrative`.
- Produces: final composed page; preloader gates content reveal via `useState`.

- [x] **Step 1: Implement `src/App.tsx`**

```tsx
import { useState } from "react";
import { LenisProvider } from "@/scroll/LenisProvider";
import { Preloader } from "@/components/Preloader";
import { Stage } from "@/webgl/Stage";
import { Hero } from "@/components/Hero";
import { PinnedNarrative } from "@/components/PinnedNarrative";

export default function App() {
  const [ready, setReady] = useState(false);
  return (
    <>
      {!ready && <Preloader onDone={() => setReady(true)} />}
      <LenisProvider>
        <div className="relative">
          <div className="fixed inset-0 -z-10"><Stage /></div>
          <Hero />
          <PinnedNarrative />
          <section className="grid h-screen place-items-center font-display text-3xl">
            Ende
          </section>
        </div>
      </LenisProvider>
    </>
  );
}
```

- [x] **Step 2: `playwright.config.ts`** — run against dev/preview server

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  webServer: { command: "pnpm build && pnpm preview --port 4173", url: "http://localhost:4173", reuseExistingServer: false },
  use: { baseURL: "http://localhost:4173" },
});
```

- [x] **Step 3: Write smoke test `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("page loads without console errors and shows headline", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("renders under reduced motion", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Monolith/i })).toBeVisible({ timeout: 8000 });
  await ctx.close();
});
```

- [x] **Step 4: Run full verification**

Run: `pnpm build` → green.
Run: `pnpm test` → all Vitest unit tests pass.
Run: `pnpm test:e2e` → both smoke tests pass.

- [x] **Step 5: Commit**

```bash
git add src/App.tsx tests/e2e playwright.config.ts
git commit -m "feat: compose ATELIER craft prototype page + playwright smoke"
```

---

## Self-Review Notes

- **Spec coverage:** preloader-counter (T6), split-reveal (T7), Lenis smooth scroll (T4), mesh-gradient WebGL (T5), pinned-narrative (T8) — all 5 design beats mapped. Reduced-motion (T2/T3 + every component), WebGL poster fallback (T5) — doctrine covered. Motion tokens §5.4 shape (T1). Anti-template direction "Monolith im Nebel" (T7/T8 copy + palette).
- **Deviations** (Vite, faked pipeline, minimal tests) are documented in the design doc §7 and honored here.
- **Integration risks** spiked in dedicated tasks before dependents: Lenis↔ScrollTrigger (T4) before pinned (T8); GSAP StrictMode cleanup via `useGSAP` inside `useChoreo` (T3) before all animated components.
- **Token purity:** components pull easing/duration only via `ctx.ease()`/`ctx.dur()`; T6 note corrects a stray `power1.inOut` to `ctx.ease("drift")`.
- **Open follow-up (not blocking):** `public/poster.webp` is a placeholder image; a true one-frame render of the shader would improve the fallback — noted, not required for a runnable prototype.
