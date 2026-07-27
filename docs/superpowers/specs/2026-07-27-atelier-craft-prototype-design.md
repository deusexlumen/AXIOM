# ATELIER Craft Prototype — Design

**Date:** 2026-07-27
**Status:** APPROVED (brainstorming)
**Type:** Runnable prototype (throwaway demo, not framework code)
**Relates to:** `ATELIER_SPEC_v3.0.md` §2 (Stack-Lock), §5.4 (Motion Language), §5.5 (Scenography), §8 (Signature Patterns)

---

## 0. Purpose

Prove the ATELIER output-craft level is real and achievable on the **mandated** motion stack.
A single runnable page that reads as agency-grade (Awwwards-class), demonstrating the craft
beats ATELIER promises — visible in a browser, not documentation.

**Explicit non-goal:** this is NOT the ATELIER framework. It fakes the entire pipeline.
It is a de-risking spike for the runtime layer only.

---

## 1. Stack (locked)

Per `ATELIER_SPEC_v3.0.md` §2, with one sanctioned prototype shortcut:

| Layer | Choice | Note |
|---|---|---|
| Build/Meta | **Vite + React 19 + TypeScript** | Prototype shortcut. Spec §2 dictates Next.js 15; craft layer (GSAP/Lenis/R3F/GLSL) is meta-framework-agnostic, and a WebGL-heavy Next page is `"use client"` everywhere anyway. Not spec-true — documented deviation. |
| Motion | **GSAP 3.13+** (ScrollTrigger, SplitText) + **@gsap/react** (`useGSAP`) | Spec dictate. Motion/Framer explicitly rejected in §2 ("GSAP ist Diktat"). Load-bearing to the deliverable: the prototype's job is to de-risk *this* stack. |
| Smooth Scroll | **Lenis** | Spec §2. ScrollTrigger-compatible. |
| 3D/WebGL | **Three.js + React Three Fiber + drei** | Spec §2. |
| Shader | **GLSL** fragment file, raw-imported | Spec §2 shader-as-own-file convention. |
| Styling | **Tailwind v4** + sanctioned `composition.css` (keyframes/clip-paths) | Spec §10 I-08 boundary. |
| Typography | **1 self-hosted variable serif** | Spec §2: systemfonts forbidden. |

---

## 2. Scope — vertical craft slice

Runtime only. **Fake the pipeline.** Not built (would make this an accidental v1):
`atl` CLI, `MOTION.json`→generated pipeline, motion-lint, scenography sidecars, PERF gates,
pattern registry, asset pipeline.

**One demo page, 5 craft beats** (all drawn from Spec §8 pattern catalog):

1. **`preloader-counter`** — counter 0→100 + asset warmup + reveal choreography
2. **`split-reveal` hero** — SplitText lines/chars, masked reveal
3. **Lenis smooth scroll** through the page
4. **One WebGL scene — `mesh-gradient-bg`** — animated gradient fragment shader.
   Chosen over `flowmap-hero` (more risk) and `distortion-media` (needs image assets):
   fragment-only, no geometry, no asset loading = cheapest reliable "wow".
5. **`pinned-narrative`** — section pins, content swaps scrubbed on scroll

**Visual direction — "Monolith im Nebel"** (Spec §5.2 example `dir_B`): dark deep surface,
heavy variable-serif display, light as the only ornament, slow-cinematic tempo. The mesh
gradient *is* the fog. Coherent, and concretely anti-template (Spec §6 anti-template heuristic).

---

## 3. Architecture

Each unit has one purpose and a defined interface. Concept-aligned to the spec even though
the pipeline is faked.

```
src/motion/tokens.ts        Hand-written. Shape mirrors §5.4 MOTION.axm.json:
                            ease{hero,snap,drift}, dur{micro,ui,reveal,scene,max},
                            stagger{chars,lines,items}, scroll{lerp,scrubDefault},
                            reducedMotion{strategy,durFactor}. Single source of motion truth.
src/motion/useChoreo.ts     Thin wrapper around @gsap/react useGSAP. THIS is the spec's
                            useChoreo (§5.4): every timeline registers here and gets
                            reduced-motion variant, cleanup, ScrollTrigger defaults for free.
                            All GSAP access funnels through here (spec I-18 concept).
src/scroll/LenisProvider.tsx  Lenis instance + GSAP ticker wiring (Integration Risk #1).
src/webgl/Stage.tsx         R3F <Canvas> wrapper + WebGL2 capability gate + poster fallback.
src/webgl/MeshGradient.tsx  R3F mesh with fragment-shader material, drift-animated via useFrame.
src/webgl/meshGradient.frag.glsl  GLSL fragment shader (mesh/flow gradient noise).
src/components/Preloader.tsx  Counter 0→100 + reveal choreography (via useChoreo).
src/components/Hero.tsx       SplitText split-reveal (via useChoreo).
src/components/PinnedNarrative.tsx  Pinned + scrubbed content (via useChoreo + ScrollTrigger).
src/App.tsx                 Composition + Lenis provider + preloader gating.
src/styles/composition.css  Sanctioned keyframes/clip-paths (masks).
tailwind theme              Dark-monolith palette + fluid type scale from direction.
public/fonts/               1 self-hosted variable serif (woff2).
public/poster.webp          Static fallback for no-WebGL / reduced-motion.
```

---

## 4. Integration risks — spike EARLY

Wire and verify these before building features on top.

### Risk #1 — Lenis ↔ ScrollTrigger
Classic breakage: two scroll systems fight. Correct wiring in `LenisProvider`:
```ts
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
```
Verify smooth scroll + a trivial ScrollTrigger fire correctly BEFORE building `pinned-narrative`.

### Risk #2 — GSAP cleanup in React 19 StrictMode
Double-invoked effects leak timelines. Use `useGSAP()` from `@gsap/react` (handles scoping +
`revert()` cleanup). Bonus: this wrapper *is* a mini-`useChoreo`, keeping the prototype
conceptually spec-aligned.

---

## 5. Doctrine (not optional — I-19)

- **reduced-motion:** `useChoreo` reads `prefers-reduced-motion: reduce` → opacity-only strategy,
  `durFactor` applied, no parallax/shake. Every registered animation obeys.
- **no WebGL:** `Stage` capability-gate renders static `poster.webp`, never errors.

---

## 6. Testing

Throwaway visual demo → minimal, not full TDD:
- `pnpm build` green (typecheck + bundle).
- One Playwright smoke: page loads without console error; page renders under
  emulated `prefers-reduced-motion: reduce`.

---

## 7. Deviations from spec (documented)

| Deviation | Why | Spec says |
|---|---|---|
| Vite, not Next.js 15 | Throwaway demo; craft layer framework-agnostic; Next would be client-only here | §2 Next.js 15 |
| Pipeline faked (hand-written tokens/scene) | Prototype = runtime only, not framework | §5.4/§5.5/§11 CLI-generated |
| Minimal tests, no motion-lint/PERF gates | Demo, not production | §6 full gate pipeline |

Everything else honors Spec §2 stack and §5.4/§8 concepts.
