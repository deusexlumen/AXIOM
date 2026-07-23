# ATELIER v3.0 — Milestone A0 Scaffold

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development`. Frischer Subagent pro Task, Spec-Review zwischen den Tasks.

**Goal:** `axm init <name>` scaffoldet eine ATELIER v3.0-App mit Next.js 15 App Router, React Three Fiber, GSAP + ScrollTrigger, Lenis, raw-loader für GLSL, den Core-Wrappers `useChoreo` / `<Stage>`, einer Scroll-Pin + WebGL-Quad Fixture-Seite und dem I-18 Lint-Rule `no-raw-motion-engine`.

**Architecture:** Das bestehende AXIOM-v2-Substrat (`feat/m2`) behält Manifest, Ownership, FIX_PACKETs und CLI-Vertrag bei. Die Scaffold-Generatoren unter `src/cli/templates/` werden von Vite 6 auf Next.js 15 umgestellt, die Runtime-Wrapper wandern nach `src/core/`, und `axm tokens build` generiert zusätzlich `src/generated/motion.ts` aus `MOTION.axm.json`. Die ESLint-Regel I-18 erlaubt direkte Imports von GSAP/Three nur innerhalb von `src/core/*`.

**Tech Stack:** Node.js 22, pnpm 9, Next.js 15.5.20, React 19.2.7, React-DOM 19.2.7, TypeScript 5.9.3, Tailwind CSS 4.3.2, React Three Fiber 9.6.1, drei 10.7.7, Three.js 0.185.1, GSAP 3.15.0, @gsap/react 2.1.2, Lenis 1.3.25, raw-loader 4.0.2, Vitest 4.1.10, Playwright 1.61.1, happy-dom 20.10.6, ESLint 9.17.0, typescript-eslint 8.19.0, eslint-config-next 15.5.20.

---

## File Structure

### Framework-Repo (`C:/Users/Buxe/Projects/AXIOM/.worktrees/m2`)

| File | Responsibility |
|---|---|
| `src/cli/schemas/motion.ts` | Zod-Schema für `MOTION.axm.json` |
| `src/cli/generators/motion.ts` | Generator `MOTION.axm.json` → `src/generated/motion.ts` |
| `src/cli/commands/tokens-build.ts` | Ruft Theme- und Motion-Generator auf, aktualisiert Manifest-Hashes |
| `src/cli/templates/next-config.ts` | `next.config.ts` Template (static export, GLSL raw-loader) |
| `src/cli/templates/app-router.ts` | `app/layout.tsx`, `app/page.tsx`, `app/globals.css` |
| `src/cli/templates/core-atelier.ts` | `src/core/Stage.tsx`, `src/core/useChoreo.ts`, `src/core/lenis.ts`, `src/core/error-boundary.tsx` |
| `src/cli/templates/shader.ts` | `src/shaders/quad.frag.glsl`, `src/types/glsl.d.ts` |
| `src/cli/templates/motion.ts` | `MOTION.axm.json` Default-Template |
| `src/cli/templates/package-json.ts` | Next/R3F/GSAP/Lenis Stack mit exakten Versionen |
| `src/cli/templates/tsconfig-json.ts` | Next.js-kompatible `tsconfig.json` |
| `src/cli/templates/eslint-config.ts` | ESLint 9 Flat Config + Next.js + axiom plugin + I-18 |
| `src/cli/templates/vitest-config.ts` | Vitest 4 Config mit happy-dom |
| `src/cli/templates/playwright-config.ts` | Playwright Config mit baseURL `http://localhost:3000` |
| `src/cli/templates/gitignore.ts` | `.gitignore` inklusive `.next/` |
| `src/cli/templates/app.ts` | Aggregator aller generierten App-Dateien |
| `src/cli/templates/ownership.ts` | LOCKED/MACHINE-Registry für ATELIER-A0 |
| `src/cli/templates/docs.ts` | Aktualisierte `.cursorrules` / `CLAUDE.md` |
| `src/cli/commands/init.ts` | Init-Orchestrierung inklusive Motion-Build |
| `packages/eslint-plugin-axiom/src/rules/no-raw-motion-engine.ts` | I-18 Regel |
| `packages/eslint-plugin-axiom/src/rules/__tests__/no-raw-motion-engine.test.ts` | Regel-Unit-Test |
| `packages/eslint-plugin-axiom/src/rules/no-default-export.ts` | Whitelist für Next.js `app/layout.tsx` / `app/page.tsx` |
| `packages/eslint-plugin-axiom/src/index.ts` | Plugin-Registry mit neuer Regel |
| `src/cli/commands/init.test.ts` | Determinismus- + Datei-Existenz-Tests |
| `src/cli/commands/init.integration.test.ts` | Build-Test + I-18 Fixture-Test |

### Generierte ATELIER-App (`<name>/`)

| File | Zone | Responsibility |
|---|---|---|
| `package.json` | OPERATOR | Deps, Scripts (`dev`, `build`, `test`, `test:e2e`, `lint`) |
| `.npmrc` | OPERATOR | `save-exact=true`, `ignore-scripts=true` |
| `tsconfig.json` | OPERATOR | Strict TypeScript, Next.js paths |
| `next.config.ts` | MACHINE | Static export, `distDir: "dist"`, GLSL raw-loader rule |
| `eslint.config.js` | OPERATOR | Next + axiom plugin, I-18 aktiv |
| `vitest.config.ts` | OPERATOR | `@/`-Alias, happy-dom, JSON reporter |
| `playwright.config.ts` | OPERATOR | baseURL `http://localhost:3000`, webServer `pnpm dev` |
| `.gitignore` | OPERATOR | `node_modules/`, `dist/`, `.next/`, `next-env.d.ts` |
| `axiom.config.json` | LOCKED | Budgets, Pipeline-Stages |
| `tokens.json` | OPERATOR | Design-Tokens v3 |
| `MOTION.axm.json` | OPERATOR | Motion-Grammatik |
| `agent-context.json` | MACHINE | Manifest SSOT |
| `.cursorrules` | MACHINE | Agenten-Regeln |
| `CLAUDE.md` | MACHINE | Agenten-Onboarding |
| `app/layout.tsx` | MACHINE | Root layout mit Theme-Import |
| `app/page.tsx` | MACHINE | A0 Fixture: Scroll-Pin + WebGL-Quad |
| `app/globals.css` | MACHINE | Tailwind + Theme-Import |
| `src/core/Stage.tsx` | LOCKED | R3F Canvas wrapper |
| `src/core/QuadMesh.tsx` | LOCKED | Fixture shader quad mesh |
| `src/core/useChoreo.ts` | LOCKED | GSAP-ScrollTrigger-Wrapper, reduced-motion |
| `src/core/lenis.ts` | LOCKED | Lenis smooth-scroll Hook |
| `src/core/error-boundary.tsx` | LOCKED | Next.js Client Error Boundary |
| `src/core/axm-select.ts` | LOCKED | Playwright-Selektor-Helfer |
| `src/generated/theme.css` | MACHINE | Aus `tokens.json` generiert |
| `src/generated/motion.ts` | MACHINE | Aus `MOTION.axm.json` generiert |
| `src/shaders/quad.frag.glsl` | MACHINE | Fixture-Fragment-Shader |
| `src/types/glsl.d.ts` | MACHINE | Type-Declaration für `.glsl`-Imports |
| `e2e/smoke.spec.ts` | AGENT | Playwright + axe-core Smoke-Test |
| `.github/workflows/axiom.yml` | MACHINE | CI Pipeline |

---

## Task 1: Motion-Schema und Generator anlegen

**Files:**
- Create: `src/cli/schemas/motion.ts`
- Create: `src/cli/generators/motion.ts`

**Schritte:**

- [ ] **Step 1: Schema `src/cli/schemas/motion.ts` erstellen**

```ts
import { z } from "zod";

const easeItemSchema = z.object({
  curve: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  meaning: z.string(),
});

const transitionSchema = z.object({
  grammar: z.string(),
  dur: z.union([z.number(), z.string()]),
  ease: z.string(),
});

export const MotionJson = z.object({
  ease: z.record(z.string(), easeItemSchema),
  dur: z.record(z.string(), z.number()),
  stagger: z.record(z.string(), z.number()),
  scroll: z.object({
    lenis: z.object({ lerp: z.number() }),
    scrubDefault: z.number(),
    pinSpacing: z.boolean(),
  }),
  transitions: z.record(z.string(), transitionSchema),
  choreography: z.object({
    revealOrder: z.array(z.string()),
    maxConcurrentTimelines: z.number(),
  }),
  reducedMotion: z.object({
    strategy: z.string(),
    durFactor: z.number(),
  }),
});

export type MotionJson = z.infer<typeof MotionJson>;
```

- [ ] **Step 2: Generator `src/cli/generators/motion.ts` erstellen**

```ts
import type { MotionJson } from "@/cli/schemas/motion.js";

function easeTuple(curve: [number, number, number, number]): string {
  return `[${curve.join(", ")}] as const`;
}

export function motionTs(motion: MotionJson): string {
  const lines: string[] = [];
  lines.push("export const motion = {");
  lines.push("  ease: {");
  for (const [key, item] of Object.entries(motion.ease)) {
    lines.push(`    ${key}: ${easeTuple(item.curve)},`);
  }
  lines.push("  },");
  lines.push("  dur: {");
  for (const [key, value] of Object.entries(motion.dur)) {
    lines.push(`    ${key}: ${value},`);
  }
  lines.push("  },");
  lines.push("  stagger: {");
  for (const [key, value] of Object.entries(motion.stagger)) {
    lines.push(`    ${key}: ${value},`);
  }
  lines.push("  },");
  lines.push(`  scroll: ${JSON.stringify(motion.scroll)},`);
  lines.push("  transitions: {");
  for (const [key, item] of Object.entries(motion.transitions)) {
    const dur = typeof item.dur === "number" ? item.dur : motion.dur[item.dur];
    const ease = motion.ease[item.ease];
    lines.push(
      `    ${key}: { grammar: "${item.grammar}", dur: ${dur}, ease: ${easeTuple(ease.curve)} },`,
    );
  }
  lines.push("  },");
  lines.push(`  choreography: ${JSON.stringify(motion.choreography)},`);
  lines.push(`  reducedMotion: ${JSON.stringify(motion.reducedMotion)},`);
  lines.push("} as const;");
  lines.push("");
  lines.push("export type Motion = typeof motion;");
  return lines.join("\n");
}
```

- [ ] **Step 3: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/cli/schemas/motion.ts src/cli/generators/motion.ts
git commit -m "feat(atelier-a0): add MOTION.axm.json schema and motion.ts generator"
```

---

## Task 2: `axm tokens build` um Motion-Generierung erweitern

**Files:**
- Modify: `src/cli/commands/tokens-build.ts`

**Schritte:**

- [ ] **Step 1: Motion-Build in `tokensBuild` einbauen**

```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { TokensJson } from "@/cli/schemas/tokens.js";
import { MotionJson } from "@/cli/schemas/motion.js";
import { themeCss } from "@/cli/generators/tokens.js";
import { motionTs } from "@/cli/generators/motion.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";

export async function tokensBuild(cwd: string, out?: NodeJS.WritableStream): Promise<void> {
  const tokensPath = resolve(cwd, "tokens.json");
  const raw = await readFile(tokensPath, "utf-8");
  const tokens = TokensJson.parse(JSON.parse(raw));
  const css = themeCss(tokens);
  const cssPath = "src/generated/theme.css";
  await writeTextFile(resolve(cwd, cssPath), css);

  const motionPath = resolve(cwd, "MOTION.axm.json");
  const motionRaw = await readFile(motionPath, "utf-8");
  const motionData = MotionJson.parse(JSON.parse(motionRaw));
  const motionCode = motionTs(motionData);
  const motionTsPath = "src/generated/motion.ts";
  await writeTextFile(resolve(cwd, motionTsPath), motionCode);

  const context = await readContext(cwd);
  context.tokens.hash = hashString(raw);
  context.integrity.machineFiles[cssPath] = hashString(css);
  context.integrity.machineFiles[motionTsPath] = hashString(motionCode);
  await writeContext(cwd, context);
  result({ ok: true, files: [cssPath, motionTsPath] }, out);
}
```

- [ ] **Step 2: Unit-Test `tokens-build` isoliert laufen lassen**

Run: `pnpm vitest run src/cli/commands/tokens-build.test.ts --reporter=verbose`
Expected: grün

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/tokens-build.ts
git commit -m "feat(atelier-a0): generate motion.ts from MOTION.axm.json in tokens build"
```

---

## Task 3: Next.js-Scaffold-Templates erstellen

**Files:**
- Create: `src/cli/templates/next-config.ts`
- Create: `src/cli/templates/app-router.ts`
- Create: `src/cli/templates/core-atelier.ts`
- Create: `src/cli/templates/shader.ts`
- Create: `src/cli/templates/motion.ts`

**Schritte:**

- [ ] **Step 1: `src/cli/templates/next-config.ts` erstellen**

```ts
export function nextConfigTs(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  webpack(config, { isServer }) {
    if (!isServer) {
      config.module.rules.push({
        test: /\\.glsl$/,
        use: "raw-loader",
      });
    }
    return config;
  },
};

export default nextConfig;
`;
}
```

- [ ] **Step 2: `src/cli/templates/app-router.ts` erstellen**

```ts
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
import { Stage, QuadMesh } from "@/core/Stage";
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
```

- [ ] **Step 3: `src/cli/templates/core-atelier.ts` erstellen**

```ts
export function stageTsx(): string {
  return `"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ReactNode } from "react";
import fragmentShader from "@/shaders/quad.frag.glsl";

interface StageProps {
  children?: ReactNode;
  className?: string;
}

const vertexShader = \`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }\`;

export function QuadMesh() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  );
}

export function Stage({ children, className }: StageProps) {
  return (
    <Canvas className={className} gl={{ antialias: true, alpha: true }}>
      {children}
    </Canvas>
  );
}
`;
}

export function useChoreoTs(): string {
  return `"use client";

import { useEffect, useMemo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ChoreoOptions {
  id: string;
}

interface ChoreoResult {
  timeline: gsap.core.Timeline;
  isReducedMotion: boolean;
}

export function useChoreo(options: ChoreoOptions): ChoreoResult {
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const timeline = useMemo(() => {
    return gsap.timeline({ id: options.id });
  }, [options.id]);

  useEffect(() => {
    return () => {
      timeline.kill();
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.id === options.id) st.kill();
      });
    };
  }, [timeline, options.id]);

  return { timeline, isReducedMotion };
}
`;
}

export function lenisTs(): string {
  return `"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis(): void {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);
}
`;
}

export function errorBoundaryTsx(): string {
  return `"use client";

import type { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props): ReactNode {
  return <ReactErrorBoundary fallback={fallback}>{children}</ReactErrorBoundary>;
}
`;
}
```

- [ ] **Step 4: `src/cli/templates/shader.ts` erstellen**

```ts
export function quadFragGlsl(): string {
  return `uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 color = vec3(
    0.5 + 0.5 * sin(uTime + vUv.x * 3.14159),
    0.2,
    0.8
  );
  gl_FragColor = vec4(color, 1.0);
}
`;
}

export function glslDts(): string {
  return `declare module "*.glsl" {
  const content: string;
  export default content;
}
`;
}
```

- [ ] **Step 5: `src/cli/templates/motion.ts` erstellen**

```ts
export function motionAxmJson(): string {
  return JSON.stringify(
    {
      ease: {
        hero: { curve: [0.16, 1, 0.3, 1], meaning: "große Enthüllungen" },
        snap: { curve: [0.83, 0, 0.17, 1], meaning: "UI-Feedback" },
        drift: { curve: [0.25, 0.1, 0.25, 1], meaning: "Ambient/Parallax" },
      },
      dur: { micro: 0.18, ui: 0.35, reveal: 0.9, scene: 1.6, max: 2.2 },
      stagger: { chars: 0.018, lines: 0.08, items: 0.12 },
      scroll: { lenis: { lerp: 0.09 }, scrubDefault: 0.8, pinSpacing: true },
      transitions: {
        pageEnter: { grammar: "mask-wipe-up", dur: "scene", ease: "hero" },
        pageExit: { grammar: "fade-scale-098", dur: "ui", ease: "snap" },
      },
      choreography: {
        revealOrder: ["display-text", "media", "body-text", "meta"],
        maxConcurrentTimelines: 3,
      },
      reducedMotion: { strategy: "opacity-only", durFactor: 0.5 },
    },
    null,
    2,
  );
}
```

- [ ] **Step 6: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add src/cli/templates/next-config.ts src/cli/templates/app-router.ts src/cli/templates/core-atelier.ts src/cli/templates/shader.ts src/cli/templates/motion.ts
git commit -m "feat(atelier-a0): add Next.js, app-router, core wrappers and shader templates"
```

---

## Task 4: Config- und Package-Templates auf Next.js Stack umstellen

**Files:**
- Modify: `src/cli/templates/package-json.ts`
- Modify: `src/cli/templates/tsconfig-json.ts`
- Modify: `src/cli/templates/eslint-config.ts`
- Modify: `src/cli/templates/vitest-config.ts`
- Modify: `src/cli/templates/playwright-config.ts`
- Modify: `src/cli/templates/gitignore.ts`
- Modify: `src/cli/templates/manifest.ts` (axiom.config.json)

**Schritte:**

- [ ] **Step 1: `src/cli/templates/package-json.ts` ersetzen**

```ts
export function packageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      packageManager: "pnpm@9.15.0",
      type: "module",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        test: "vitest run --reporter=json",
        "test:e2e": "playwright test --reporter=json",
        lint: "eslint .",
      },
      dependencies: {
        next: "15.5.20",
        react: "19.2.7",
        "react-dom": "19.2.7",
        "@react-three/fiber": "9.6.1",
        "@react-three/drei": "10.7.7",
        three: "0.185.1",
        gsap: "3.15.0",
        "@gsap/react": "2.1.2",
        lenis: "1.3.25",
        "react-error-boundary": "5.0.0",
        zustand: "5.0.3",
        zod: "4.4.3",
      },
      devDependencies: {
        "@axiom/cli": "file:./packages/axiom-cli",
        "@types/node": "22.10.5",
        "@types/react": "19.2.17",
        "@types/react-dom": "19.2.3",
        "@types/three": "0.185.1",
        "@playwright/test": "1.61.1",
        "axe-core": "4.10.2",
        "@axe-core/playwright": "4.10.1",
        eslint: "9.17.0",
        "@eslint/js": "9.17.0",
        "typescript-eslint": "8.19.0",
        "eslint-config-next": "15.5.20",
        "eslint-plugin-axiom": "file:./packages/eslint-plugin-axiom",
        typescript: "5.9.3",
        vitest: "4.1.10",
        "@testing-library/react": "16.3.2",
        "@testing-library/dom": "10.4.0",
        "happy-dom": "20.10.6",
        tailwindcss: "4.3.2",
        "raw-loader": "4.0.2",
      },
    },
    null,
    2,
  );
}
```

- [ ] **Step 2: `src/cli/templates/tsconfig-json.ts` ersetzen**

```ts
export function tsConfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noUncheckedIndexedAccess: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
        types: ["react", "react-dom", "node"],
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2,
  );
}
```

- [ ] **Step 3: `src/cli/templates/eslint-config.ts` ersetzen**

```ts
export function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import axiom from "eslint-plugin-axiom";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".next/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  next,
  {
    languageOptions: { parserOptions: { project: "./tsconfig.json" } },
    plugins: { axiom },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "axiom/max-loc": ["error", { max: 120 }],
      "axiom/no-default-export": "error",
      "axiom/no-barrel": "error",
      "axiom/absolute-imports": "error",
      "axiom/tokens-only": "error",
      "axiom/no-escape-hatch": "error",
      "axiom/static-imports": "error",
      "axiom/require-axm-id": "error",
      "axiom/no-raw-motion-engine": "error",
    },
  }
);
`;
}
```

- [ ] **Step 4: `src/cli/templates/vitest-config.ts` ersetzen**

```ts
export function vitestConfigTs(): string {
  return `import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: false,
    environment: "happy-dom",
    reporters: ["json"],
    exclude: ["node_modules/**", "dist/**", ".next/**", "packages/**", "e2e/**"],
  },
});
`;
}
```

- [ ] **Step 5: `src/cli/templates/playwright-config.ts` ersetzen**

```ts
export function playwrightConfigTs(): string {
  return `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "json",
  use: {
    baseURL: "http://localhost:3000/",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/",
    reuseExistingServer: true,
  },
});
`;
}
```

- [ ] **Step 6: `src/cli/templates/gitignore.ts` ersetzen**

```ts
export function gitignore(): string {
  return `node_modules/
dist/
.next/
next-env.d.ts
*.log
.DS_Store
.env
.env.local
coverage/
playwright-report/
test-results/
`;
}
```

- [ ] **Step 7: `src/cli/templates/manifest.ts` `axiomConfigJson()` anpassen**

Pipeline-Stages entfernen `contract` (API/DB fallen in A0 heraus):

```ts
export function axiomConfigJson(): string {
  return JSON.stringify(
    {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: {
        stages: ["validate", "typecheck", "lint", "unit", "e2e"],
        e2eOn: "route-change",
      },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
      ci: { headlessHeal: { enabled: false } },
    },
    null,
    2,
  );
}
```

- [ ] **Step 8: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 9: Commit**

```bash
git add src/cli/templates/package-json.ts src/cli/templates/tsconfig-json.ts src/cli/templates/eslint-config.ts src/cli/templates/vitest-config.ts src/cli/templates/playwright-config.ts src/cli/templates/gitignore.ts src/cli/templates/manifest.ts
git commit -m "feat(atelier-a0): switch scaffold config templates to Next.js 15 stack"
```

---

## Task 5: App-Datei-Aggregator und Ownership-Registry aktualisieren

**Files:**
- Modify: `src/cli/templates/app.ts`
- Modify: `src/cli/templates/ownership.ts`

**Schritte:**

- [ ] **Step 1: `src/cli/templates/app.ts` ersetzen**

```ts
import type { AppFile } from "@/cli/templates/types.js";
import { packageJson } from "@/cli/templates/package-json.js";
import { npmrc } from "@/cli/templates/npmrc.js";
import { tsConfigJson } from "@/cli/templates/tsconfig-json.js";
import { eslintConfigJs } from "@/cli/templates/eslint-config.js";
import { vitestConfigTs } from "@/cli/templates/vitest-config.js";
import { axiomConfigJson, tokensJson } from "@/cli/templates/manifest.js";
import { axmSelectTs } from "@/cli/templates/playwright-helpers.js";
import { stylesCss } from "@/cli/templates/generated.js";
import { mainTsx, appTsx, appTestTsx, indexHtml } from "@/cli/templates/app-entry.js";
import { gitignore } from "@/cli/templates/gitignore.js";
import { smokeSpecTs } from "@/cli/templates/e2e/smoke.spec.js";
import { playwrightConfigTs } from "@/cli/templates/playwright-config.js";
import { ciWorkflowYaml } from "@/cli/templates/ci-workflow.js";
import { nextConfigTs } from "@/cli/templates/next-config.js";
import { layoutTsx, pageTsx, globalsCss } from "@/cli/templates/app-router.js";
import { stageTsx, quadMeshTsx, useChoreoTs, lenisTs, errorBoundaryTsx } from "@/cli/templates/core-atelier.js";
import { quadFragGlsl, glslDts } from "@/cli/templates/shader.js";
import { motionAxmJson } from "@/cli/templates/motion.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";

export function gitkeepTemplate(): string {
  return "";
}

export function appFiles(projectName: string): AppFile[] {
  const config = JSON.parse(axiomConfigJson()) as {
    ci?: { headlessHeal?: { enabled?: boolean } };
  };
  const headlessHealEnabled = config.ci?.headlessHeal?.enabled ?? false;

  return [
    { path: ".github/workflows/axiom.yml", content: ciWorkflowYaml({ headlessHealEnabled }) },
    { path: "package.json", content: packageJson(projectName) },
    { path: ".npmrc", content: npmrc() },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "next.config.ts", content: nextConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "vitest.config.ts", content: vitestConfigTs() },
    { path: "playwright.config.ts", content: playwrightConfigTs() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "tokens.json", content: tokensJson() },
    { path: "MOTION.axm.json", content: motionAxmJson() },
    { path: "app/layout.tsx", content: layoutTsx(projectName) },
    { path: "app/page.tsx", content: pageTsx() },
    { path: "app/globals.css", content: globalsCss() },
    { path: "src/core/Stage.tsx", content: stageTsx() },
    { path: "src/core/QuadMesh.tsx", content: quadMeshTsx() },
    { path: "src/core/useChoreo.ts", content: useChoreoTs() },
    { path: "src/core/lenis.ts", content: lenisTs() },
    { path: "src/core/error-boundary.tsx", content: errorBoundaryTsx() },
    { path: "src/core/axm-select.ts", content: axmSelectTs() },
    { path: "src/shaders/quad.frag.glsl", content: quadFragGlsl() },
    { path: "src/types/glsl.d.ts", content: glslDts() },
    { path: "src/components/.gitkeep", content: gitkeepTemplate() },
    { path: "src/state/.gitkeep", content: gitkeepTemplate() },
    { path: ".axiom/.gitkeep", content: gitkeepTemplate() },
    { path: "orders/done/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/.gitkeep", content: gitkeepTemplate() },
    { path: "pipeline/bench/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/decisions.ndjson", content: gitkeepTemplate() },
    { path: "pipeline/bench/cost.ndjson", content: gitkeepTemplate() },
    { path: "e2e/.gitkeep", content: gitkeepTemplate() },
    { path: "e2e/smoke.spec.ts", content: smokeSpecTs() },
    { path: ".gitignore", content: gitignore() },
  ];
}
```

- [ ] **Step 2: `src/cli/templates/ownership.ts` ersetzen**

```ts
export interface Ownership {
  locked: string[];
  machine: string[];
}

export function ownershipFiles(): Ownership {
  return {
    locked: [
      "src/core/error-boundary.tsx",
      "src/core/Stage.tsx",
      "src/core/QuadMesh.tsx",
      "src/core/useChoreo.ts",
      "src/core/lenis.ts",
      "src/core/axm-select.ts",
      "axiom.config.json",
    ],
    machine: [
      "src/generated/theme.css",
      "src/generated/motion.ts",
      ".cursorrules",
      "CLAUDE.md",
      "agent-context.json",
      ".axiom/leases.json",
      "ledger/decisions.ndjson",
      "pipeline/bench/cost.ndjson",
      ".github/workflows/axiom.yml",
      "next.config.ts",
      "app/layout.tsx",
      "app/page.tsx",
      "app/globals.css",
      "src/shaders/quad.frag.glsl",
      "src/types/glsl.d.ts",
    ],
  };
}
```

- [ ] **Step 3: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/cli/templates/app.ts src/cli/templates/ownership.ts
git commit -m "feat(atelier-a0): wire Next.js scaffold into app aggregator and ownership"
```

---

## Task 6: Agenten-Dokumentation auf ATELIER v3 aktualisieren

**Files:**
- Modify: `src/cli/templates/docs.ts`

**Schritte:**

- [ ] **Step 1: `src/cli/templates/docs.ts` ersetzen**

```ts
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function cursorRules(context: AgentContext): string {
  return `# ATELIER Agent Rules — ${context.project.name}

# Stack
- Runtime: Node.js 22, Package Manager: pnpm 9, Meta-Framework: Next.js 15 (App Router, static export)
- UI: React 19 (Function Components), Styling: Tailwind v4
- Motion: GSAP 3.15 + ScrollTrigger, Smooth Scroll: Lenis 1.3.25
- WebGL: React Three Fiber 9.6 + drei 10.7 + Three.js 0.185
- Shader: GLSL via raw-loader, State: Zustand 5, Schema: Zod 4
- Tests: Vitest 4, E2E: Playwright + axe-core

# Cardinal Rules
1. Lies zuerst agent-context.json, nicht das Repo.
2. Ein FIX_PACKET = eine Korrektur = ein Re-Run.
3. Splitte Dateien statt Budgets zu überschreiten.
4. Motion nur über useChoreo / <Stage> — niemals rohe GSAP/Three-Imports außerhalb von src/core/.

# Invariants
- I-01: Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare)
- I-02: Max. 4096 Bytes pro Quelldatei
- I-03: Genau ein benannter Export pro Komponenten-Datei
- I-04: Keine Default-Exports (außer app/layout.tsx, app/page.tsx, next.config.ts)
- I-05: Keine Barrel-Files (index.ts mit Re-Exports)
- I-06: Imports ausschließlich absolut via Alias @/
- I-07: Jede Komponente besitzt eine Sidecar-Datei <Name>.spec.json
- I-08: Keine Raw-Farbwerte/Pixel; nur Token-Referenzen
- I-09: Kein any, kein @ts-ignore, kein eslint-disable
- I-10: Verzeichnisse haben Ownership-Zonen
- I-11: Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema
- I-12: Keine dynamischen Imports mit variablen Pfaden
- I-13: Jede Komponente rendert data-axm-id="<Name>" auf dem Root-JSX-Element
- I-18: Kein GSAP/Three-Import außerhalb von useChoreo / <Stage> Core-Wrappers
- I-19: Jede Animation deklariert reduced-motion-Verhalten
- I-20: DIRECTION/MOTION/SCENOGRAPHY sind nach Freeze hash-versiegelt

# Ownership Zones
- LOCKED: src/core/, app/, axiom.config.json
- MACHINE: src/generated/, .cursorrules, CLAUDE.md, agent-context.json, next.config.ts
- AGENT: src/components/, src/state/, e2e/
- OPERATOR: tokens.json, MOTION.axm.json, DIRECTION.axm.json

# CLI Cheat Sheet
- axm add component <Name>
- axm validate
- axm pipeline run
- axm tokens build
- axm context slice --for <file>
- axm split <file> --at <export|line>
- axm heal --auto
`;
}

export function claudeMd(context: AgentContext): string {
  return `# ATELIER Agent Onboarding — ${context.project.name}

## Cardinal Rules
1. Lies das Manifest (\`agent-context.json\`), nicht das Repo.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite Budgets nicht; verwende \`axm split\`.
4. Motion nur über \`useChoreo\` / \`<Stage>\` — niemals rohe GSAP/Three-Imports außerhalb von \`src/core/\`.

## Invariants
| ID | Invariante |
|----|------------|
| I-01 | Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare) |
| I-02 | Max. 4096 Bytes pro Quelldatei |
| I-03 | Genau ein benannter Export pro Komponenten-Datei |
| I-04 | Keine Default-Exports (außer \`app/layout.tsx\`, \`app/page.tsx\`, \`next.config.ts\`) |
| I-05 | Keine Barrel-Files (\`index.ts\` mit Re-Exports) |
| I-06 | Imports ausschließlich absolut via Alias \`@/\` |
| I-07 | Jede Komponente besitzt eine Sidecar-Datei \`<Name>.spec.json\` |
| I-08 | Keine Raw-Farbwerte/Pixel; nur Token-Referenzen |
| I-09 | Kein \`any\`, kein \`@ts-ignore\`, kein \`eslint-disable\` |
| I-10 | Verzeichnisse haben Ownership-Zonen |
| I-11 | Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |
| I-13 | Jede Komponente rendert \`data-axm-id="<Name>"\` auf dem Root-JSX-Element |
| I-18 | Kein GSAP/Three-Import außerhalb von \`useChoreo\` / \`<Stage>\` Core-Wrappers |
| I-19 | Jede Animation deklariert reduced-motion-Verhalten |
| I-20 | \`DIRECTION\` / \`MOTION\` / \`SCENOGRAPHY\` sind nach Freeze hash-versiegelt |

## Ownership Zones
- **LOCKED:** \`src/core/\`, \`app/\`, \`axiom.config.json\` — Nur Framework-Updates.
- **MACHINE:** \`src/generated/\`, \`.cursorrules\`, \`CLAUDE.md\`, \`agent-context.json\`, \`next.config.ts\` — Nur via \`axm\`-CLI.
- **AGENT:** \`src/components/\`, \`src/state/\`, \`e2e/\` — Freie Schreibzone unter Invarianten.
- **OPERATOR:** \`tokens.json\`, \`MOTION.axm.json\`, \`DIRECTION.axm.json\` — Mensch editiert.

## CLI Cheat Sheet
- \`axm add component <Name>\`
- \`axm validate\`
- \`axm pipeline run\`
- \`axm tokens build\`
- \`axm context slice --for <file>\`
- \`axm split <file> --at <export|line>\`
- \`axm heal --auto\`
`;
}
```

- [ ] **Step 2: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/cli/templates/docs.ts
git commit -m "docs(atelier-a0): update agent docs for Next.js + motion wrappers + I-18"
```

---

## Task 7: Init-Orchestrierung für Next.js + Motion anpassen

**Files:**
- Modify: `src/cli/commands/init.ts`

**Schritte:**

- [ ] **Step 1: `src/cli/commands/init.ts` anpassen**

Der initiale Route-Manifest-Generator ist in A0 nicht mehr erforderlich, da Next.js Dateisystem-Routing verwendet. Entferne den Aufruf von `routeManifestTs` und das Schreiben von `src/generated/route-manifest.tsx`. Der Rest bleibt identisch.

```ts
import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve, basename, dirname } from "node:path";
import { execSync } from "node:child_process";
import { appFiles } from "@/cli/templates/app.js";
import { ownershipFiles } from "@/cli/templates/ownership.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { tokensBuild } from "@/cli/commands/tokens-build.js";
import { writeLeases } from "@/cli/leases/store.js";
import { bundleEslintPlugin, bundleCliPackage } from "@/cli/commands/init-bundle.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";
import { fileURLToPath } from "node:url";

export interface InitOptions {
  cwd?: string;
  skipInstall?: boolean;
  out?: NodeJS.WritableStream;
}

export async function init(name: string, options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const targetDir = resolve(cwd, name);
  await mkdir(targetDir, { recursive: true });

  const projectName = basename(name);
  const created: string[] = [];
  for (const file of appFiles(projectName)) {
    const fullPath = resolve(targetDir, file.path);
    await writeTextFile(fullPath, file.content);
    created.push(file.path);
  }

  const cliRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

  await bundleEslintPlugin(targetDir, cliRoot);
  created.push("packages/eslint-plugin-axiom");

  await bundleCliPackage(targetDir, cliRoot);
  created.push("packages/axiom-cli");

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  await writeContext(targetDir, context);
  created.push("agent-context.json");

  await writeLeases(targetDir, []);
  created.push(".axiom/leases.json");

  await writeTextFile(resolve(targetDir, ".cursorrules"), cursorRules(context));
  created.push(".cursorrules");
  await writeTextFile(resolve(targetDir, "CLAUDE.md"), claudeMd(context));
  created.push("CLAUDE.md");

  await tokensBuild(targetDir, options.out);

  const updatedContext = await readContext(targetDir);
  const ownership = ownershipFiles();
  for (const file of ownership.locked) {
    updatedContext.integrity.lockedFiles[file] = await hashFile(resolve(targetDir, file));
  }
  for (const file of ownership.machine) {
    if (file === "agent-context.json") continue;
    updatedContext.integrity.machineFiles[file] = await hashFile(resolve(targetDir, file));
  }
  await writeContext(targetDir, updatedContext);

  if (!options.skipInstall) {
    execSync("pnpm install --prefer-offline", { cwd: targetDir, stdio: "ignore" });
  }

  const output: InitResult = {
    ok: true,
    created,
    next: "axm add component <Name>",
  };
  result(output, options.out);
}
```

- [ ] **Step 2: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/init.ts
git commit -m "feat(atelier-a0): update init orchestration for Next.js + motion build"
```

---

## Task 8: ESLint-Regel I-18 `no-raw-motion-engine` hinzufügen

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/no-raw-motion-engine.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/no-raw-motion-engine.test.ts`
- Modify: `packages/eslint-plugin-axiom/src/index.ts`

**Schritte:**

- [ ] **Step 1: Regel `packages/eslint-plugin-axiom/src/rules/no-raw-motion-engine.ts` erstellen**

```ts
import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

const FORBIDDEN = new Set([
  "gsap",
  "three",
  "@react-three/fiber",
  "@react-three/drei",
]);

function isForbidden(source: string): string | undefined {
  for (const name of FORBIDDEN) {
    if (source === name || source.startsWith(`${name}/`)) {
      return name;
    }
  }
  return undefined;
}

export const noRawMotionEngine = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-18: no raw GSAP/Three imports outside core wrappers" },
    schema: [],
    messages: {
      noRawMotionEngine:
        "I-18: Direct import of {{name}} is forbidden outside src/core/* wrappers. Use useChoreo or Stage.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const filename = context.filename ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (normalized.includes("/src/core/")) {
      return {};
    }
    return {
      ImportDeclaration(node): void {
        const source = node.source.value;
        if (typeof source !== "string") return;
        const name = isForbidden(source);
        if (name === undefined) return;
        context.report({
          node: node.source,
          messageId: "noRawMotionEngine",
          data: { name },
        });
      },
    };
  },
});
```

- [ ] **Step 2: Regel-Test `packages/eslint-plugin-axiom/src/rules/__tests__/no-raw-motion-engine.test.ts` erstellen**

```ts
import { RuleTester } from "eslint";
import { noRawMotionEngine } from "@/rules/no-raw-motion-engine.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("no-raw-motion-engine", noRawMotionEngine, {
  valid: [
    { code: "import { useChoreo } from '@/core/useChoreo';\n", filename: "src/components/Hero.tsx" },
    { code: "import gsap from 'gsap';\n", filename: "src/core/useChoreo.ts" },
    { code: "import { Canvas } from '@react-three/fiber';\n", filename: "src/core/Stage.tsx" },
    { code: "import * as THREE from 'three';\n", filename: "src/core/Stage.tsx" },
  ],
  invalid: [
    {
      code: "import gsap from 'gsap';\n",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
    {
      code: "import { Canvas } from '@react-three/fiber';\n",
      filename: "src/components/Scene.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
    {
      code: "import { ScrollTrigger } from 'gsap/ScrollTrigger';\n",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
  ],
});
```

- [ ] **Step 3: `packages/eslint-plugin-axiom/src/index.ts` aktualisieren**

```ts
import { maxLoc } from "@/rules/max-loc.js";
import { noDefaultExport } from "@/rules/no-default-export.js";
import { noBarrel } from "@/rules/no-barrel.js";
import { absoluteImports } from "@/rules/absolute-imports.js";
import { tokensOnly } from "@/rules/tokens-only.js";
import { noEscapeHatch } from "@/rules/no-escape-hatch.js";
import { staticImports } from "@/rules/static-imports.js";
import { requireAxmId } from "@/rules/require-axm-id.js";
import { noRawMotionEngine } from "@/rules/no-raw-motion-engine.js";

const plugin = {
  meta: {
    name: "eslint-plugin-axiom",
    version: "1.0.0",
  },
  rules: {
    "max-loc": maxLoc,
    "no-default-export": noDefaultExport,
    "no-barrel": noBarrel,
    "absolute-imports": absoluteImports,
    "tokens-only": tokensOnly,
    "no-escape-hatch": noEscapeHatch,
    "static-imports": staticImports,
    "require-axm-id": requireAxmId,
    "no-raw-motion-engine": noRawMotionEngine,
  },
};

export default plugin;
```

- [ ] **Step 4: Plugin-Tests laufen lassen**

Run: `pnpm --filter eslint-plugin-axiom test`
Expected: alle grün

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/no-raw-motion-engine.ts packages/eslint-plugin-axiom/src/rules/__tests__/no-raw-motion-engine.test.ts packages/eslint-plugin-axiom/src/index.ts
git commit -m "feat(eslint-plugin-axiom): add I-18 no-raw-motion-engine rule"
```

---

## Task 9: `no-default-export` für Next.js Default-Exports whitelisten

**Files:**
- Modify: `packages/eslint-plugin-axiom/src/rules/no-default-export.ts`

**Schritte:**

- [ ] **Step 1: Regel aktualisieren**

```ts
import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const noDefaultExport = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-04: no default exports" },
    schema: [],
    messages: { noDefaultExport: "I-04: Default exports are forbidden. Use named exports only." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const filename = (context.filename ?? "").replace(/\\/g, "/");
    if (
      /\.config\.[mc]?[jt]sx?$/.test(filename) ||
      /\.route\.[mc]?[jt]sx?$/.test(filename) ||
      /\/app\/(layout|page)\.[mc]?[jt]sx?$/.test(filename)
    ) {
      return {};
    }
    return {
      ExportDefaultDeclaration(node): void {
        context.report({ node, messageId: "noDefaultExport" });
      },
    };
  },
});
```

- [ ] **Step 2: Regel-Test erweitern**

In `packages/eslint-plugin-axiom/src/rules/__tests__/no-default-export.test.ts` folgende valid cases hinzufügen:

```ts
{ code: "export default function RootLayout() { return null; }\n", filename: "app/layout.tsx" },
{ code: "export default function HomePage() { return null; }\n", filename: "app/page.tsx" },
```

- [ ] **Step 3: Plugin-Tests laufen lassen**

Run: `pnpm --filter eslint-plugin-axiom test`
Expected: alle grün

- [ ] **Step 4: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/no-default-export.ts packages/eslint-plugin-axiom/src/rules/__tests__/no-default-export.test.ts
git commit -m "fix(eslint-plugin-axiom): whitelist Next.js app/layout and app/page default exports"
```

---

## Task 10: Init-Unit-Tests auf Next.js-Scaffold umstellen

**Files:**
- Modify: `src/cli/commands/init.test.ts`

**Schritte:**

- [ ] **Step 1: Erwartungen in `src/cli/commands/init.test.ts` aktualisieren**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { createHash } from "node:crypto";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function snapshotDir(dir: string): Map<string, string> {
  const entries = readdirSync(dir, { recursive: true, encoding: "utf-8" })
    .filter((f) => f !== "")
    .filter(
      (f) =>
        !f.startsWith("node_modules/") && !f.includes("/dist/") && f !== "pnpm-lock.yaml",
    )
    .map((f) => join(dir, f))
    .filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    })
    .sort();

  const map = new Map<string, string>();
  for (const entry of entries) {
    map.set(relative(dir, entry), hashFile(entry));
  }
  return map;
}

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("axm init", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("creates expected Next.js scaffold files", { timeout: 30000 }, async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    const files = readdirSync(appDir, { recursive: true, encoding: "utf-8" })
      .filter((f) => f !== "")
      .sort();
    expect(files).toContain("package.json");
    expect(files).toContain("tsconfig.json");
    expect(files).toContain("next.config.ts");
    expect(files).toContain(join("app", "layout.tsx"));
    expect(files).toContain(join("app", "page.tsx"));
    expect(files).toContain(join("app", "globals.css"));
    expect(files).toContain(join("src", "core", "Stage.tsx"));
    expect(files).toContain(join("src", "core", "useChoreo.ts"));
    expect(files).toContain(join("src", "core", "lenis.ts"));
    expect(files).toContain(join("src", "core", "error-boundary.tsx"));
    expect(files).toContain(join("src", "shaders", "quad.frag.glsl"));
    expect(files).toContain("MOTION.axm.json");
    expect(files).toContain(join("src", "generated", "motion.ts"));
    expect(files).not.toContain(join("src", "main.tsx"));
    expect(files).not.toContain(join("src", "App.tsx"));
    expect(files).not.toContain("vite.config.ts");
    expect(files).not.toContain("index.html");

    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf-8"));
    expect(pkg.name).toBe("demo");
    expect(pkg.packageManager).toBe("pnpm@9.15.0");
    expect(pkg.dependencies.next).toBe("15.5.20");
    expect(pkg.dependencies.gsap).toBe("3.15.0");
    expect(pkg.dependencies.lenis).toBe("1.3.25");
    expect(pkg.devDependencies["@types/react"]).toBe("19.2.17");
    expect(pkg.devDependencies).toHaveProperty("@axiom/cli");

    const workflowPath = join(appDir, ".github", "workflows", "axiom.yml");
    expect(statSync(workflowPath).isFile()).toBe(true);
    const workflow = readFileSync(workflowPath, "utf-8");
    expect(workflow).toContain("actions/checkout@v4");
    expect(workflow).toContain("pnpm/action-setup@v4");
    expect(workflow).toContain("actions/setup-node@v4");
    expect(existsSync(join(appDir, "packages", "axiom-cli", "package.json"))).toBe(true);
  });

  it("is deterministic across runs", { timeout: 30000 }, async () => {
    await init("a", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const first = snapshotDir(join(baseDir, "a"));

    rmSync(join(baseDir, "a"), { recursive: true, force: true });

    await init("a", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const second = snapshotDir(join(baseDir, "a"));

    expect(second.size).toBe(first.size);
    for (const [path, hash] of first) {
      expect(second.get(path)).toBe(hash);
    }
  });
});
```

- [ ] **Step 2: Unit-Tests laufen lassen**

Run: `pnpm vitest run src/cli/commands/init.test.ts --reporter=verbose`
Expected: grün

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/init.test.ts
git commit -m "test(atelier-a0): update init unit tests for Next.js scaffold"
```

---

## Task 11: Init-Integrationstest mit Build + I-18 Fixture

**Files:**
- Modify: `src/cli/commands/init.integration.test.ts`

**Schritte:**

- [ ] **Step 1: Integrationstest `src/cli/commands/init.integration.test.ts` ersetzen**

```ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { Writable } from "node:stream";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("axm init integration", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-init-integ-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("scaffold installs and builds with pnpm", { timeout: 300000 }, async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    installAppDeps(appDir);
    execSync("pnpm build", { cwd: appDir, stdio: "ignore" });
    expect(existsSync(join(appDir, "dist", "index.html"))).toBe(true);
  });

  it("detects I-18 raw motion engine import via lint", { timeout: 120000 }, async () => {
    await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
    const appDir = join(baseDir, "demo");
    installAppDeps(appDir);

    writeFileSync(
      join(appDir, "src", "components", "RawMotion.tsx"),
      `import gsap from "gsap";\nexport function RawMotion() { gsap.to({}, {}); return null; }\n`,
      "utf-8",
    );

    let lintOutput = "";
    try {
      execSync("pnpm lint", { cwd: appDir, stdio: "pipe", encoding: "utf-8" });
    } catch (error) {
      lintOutput = String((error as { stdout?: string; stderr?: string }).stdout ?? "");
      lintOutput += String((error as { stdout?: string; stderr?: string }).stderr ?? "");
    }

    expect(lintOutput).toContain("noRawMotionEngine");
    expect(lintOutput).toContain("I-18");
    expect(lintOutput).toContain("src/components/RawMotion.tsx");
  });
});
```

- [ ] **Step 2: Integrationstest laufen lassen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/init.integration.test.ts --reporter=verbose`
Expected: grün

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/init.integration.test.ts
git commit -m "test(atelier-a0): integration test for Next.js build and I-18 fixture"
```

---

## Task 12: R3F-Typen-Konflikte und Build-Fixtures abfedern

**Files:**
- Modify: `src/cli/templates/tsconfig-json.ts`
- Modify: `src/cli/templates/eslint-config.ts` (falls nötig)

**Schritte:**

- [ ] **Step 1: `@types/three` und R3F-Typen sicherstellen**

Falls `pnpm build` im Scaffold wegen fehlender `three`-Typen fehlschlägt, ergänze in `tsconfig.json` `types` um `"three"`:

```json
"types": ["react", "react-dom", "node", "three"]
```

- [ ] **Step 2: ESLint-Regel `@next/next/no-html-link-for-pages` abschalten, falls sie die Fixture-Seite blockiert**

Falls `eslint-config-next` Warnungen/Fehler auf der statischen Export-Seite wirft, ergänze in `eslint.config.js` vor der axiom-Config:

```js
{
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
}
```

- [ ] **Step 3: Build prüfen**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/cli/templates/tsconfig-json.ts src/cli/templates/eslint-config.ts
git commit -m "fix(atelier-a0): scaffold type and eslint adjustments for R3F/Next.js" || true
```

---

## Task 13: Finale Verifikation

**Files:** alle obigen

- [ ] **Step 1: Framework-Build**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 2: Framework-Unit-Tests**

Run: `pnpm test`
Expected: 77 suites, 93 tests, 0 failures (plus neue A0-Tests)

- [ ] **Step 3: ESLint-Plugin-Tests**

Run: `pnpm --filter eslint-plugin-axiom test`
Expected: alle grün

- [ ] **Step 4: Integrationstests**

Run: `pnpm run test:integration`
Expected: 0 failures

- [ ] **Step 5: Manuelle Scaffold-Verifikation**

Run:
```bash
node dist/cli/bin.js init atelier-a0-demo --json
cd atelier-a0-demo
pnpm install
pnpm build
pnpm lint
```

Expected:
- `pnpm build` erzeugt `dist/index.html`
- `pnpm lint` ist grün auf dem Default-Scaffold

- [ ] **Step 6: I-18 Fixture manuell prüfen**

Run:
```bash
cd atelier-a0-demo
printf 'import gsap from "gsap";\nexport function X() { return null; }\n' > src/components/Violation.tsx
pnpm lint
```

Expected: Lint schlägt fehl mit `noRawMotionEngine` / `I-18` in `src/components/Violation.tsx`.

- [ ] **Step 7: Commit**

```bash
git status
# Nur Source-Änderungen committen, nicht das Demo-Verzeichnis
git add -A
git reset -- atelier-a0-demo || true
rm -rf atelier-a0-demo
git commit -m "feat(atelier-a0): complete Next.js 15 + R3F + GSAP + Lenis scaffold"
```

---

## Spec Coverage

| ATELIER_SPEC_v3.0 Requirement | Task |
|---|---|
| §2 Stack-Lock: Next 15 + R3F + GSAP + Lenis | Task 3, 4 |
| §5.4 MOTION Tokensystem + `motion.ts` | Task 1, 2 |
| §10 I-18: Kein GSAP/Three-Import außerhalb Core-Wrappers | Task 8 |
| §10 I-19: reduced-motion-Grundlage in `useChoreo` | Task 3 |
| §14 A0 Abnahme: Fixture-Seite Scroll-Pin + WebGL-Quad | Task 3, 11 |
| §14 A0 Abnahme: I-18-Verstoß-Fixture | Task 8, 11 |
| §2 Shader-Loader (raw-loader) | Task 3 |
| §3 Agent-agnostische Schnittstelle (Docs) | Task 6 |

---

## Placeholder Scan

- Keine `TODO`, `TBD`, `implement later`, `add appropriate error handling`.
- Keine unspezifischen Code-Snippets: jede Datei ist vollständig angegeben.
- Jeder Test-Step enthält konkrete Befehle und erwartete Ergebnisse.

---

## Execution Handoff

**Plan complete and saved to `C:/Users/Buxe/Projects/AXIOM/.worktrees/m2/docs/superpowers/plans/2026-07-11-atelier-a0-scaffold.md`.**

Execution options:

1. **Subagent-Driven (recommended)** — Dispatch einen frischen Subagenten pro Task (1–13), führe Spec-Review zwischen den Tasks durch.
2. **Inline Execution** — Führe Tasks in dieser Session aus, batchweise mit Checkpoints nach Task 7 und Task 11.

Recommended first subagent prompt: "Implement Task 1 of `docs/superpowers/plans/2026-07-11-atelier-a0-scaffold.md`: create `src/cli/schemas/motion.ts` and `src/cli/generators/motion.ts`, then run `pnpm build` and commit."
