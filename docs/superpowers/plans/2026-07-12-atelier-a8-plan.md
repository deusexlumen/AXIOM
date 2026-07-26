# ATELIER A8 — Gesamtabnahme S-20 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** A8 GREEN — `atl deploy --env preview` liefert eine URL für Track-A- und Track-B-Referenzprojekte; alle deterministischen Gates sind GREEN; CRITIC-Report ≥ 4/5 auf Richtungstreue und Anti-Template; Formular-Modul ist integriert.

**Architecture:** Zwei Referenzprojekte (Track-A CURATED Kampagnen-Page, Track-B BESPOKE Portfolio) werden als vollständige Fixtures im CLI-Repo gehalten. `atl plan` liest `BRIEF.axm.json`, wählt Track-A- oder Track-B-DAG, generiert Directions (Track A aus Preset-Katalog, Track B via LLM/Template) und spawnt Build-Orders. Ein `build`-Pipeline-Stage führt `pnpm build` aus und synchronisiert `next.config.ts` mit der PERF-Stage. Ein Formular-Modul (Hono-Endpoint + Kontakt-Page + E2E) schließt das einzige Backend-Relikt ab. Ein S-20-Integrationstest fährt Brief → Plan → Build → Deploy → URL durch.

**Tech Stack:** Next.js 15, React 19, GSAP, R3F, Hono, Zod, Vitest, Playwright, Vercel-CLI (mockbar).

---

## File Structure

**Neu (Formular-Modul):**
- `src/cli/templates/api/contact.ts` — Hono-Route für `/api/contact`
- `src/cli/templates/components/ContactForm.ts` — React-Komponente
- `src/cli/templates/pages/contact.ts` — Next.js App-Router Page `/contact`
- `src/cli/commands/form.ts` — `atl form add <route>` (optional; reicht für A8 ein festes Template)
- `src/cli/schemas/form.ts` — Zod-Schema für Kontakt-Submission
- `src/cli/commands/form.test.ts` — Unit-Test
- `e2e/contact.spec.ts` (im generierten Projekt) — E2E-Test via Playwright

**Neu (Build-Stage):**
- `src/cli/pipeline/stages/build.ts` — führt `pnpm build` aus
- `src/cli/pipeline/stages/build.test.ts` — Unit-Test
- Modifikation `src/cli/pipeline/select-stages.ts` — `build` vor `perf` einfügen
- Modifikation `src/cli/pipeline/types.ts` — `StageName` erweitern
- Modifikation `src/cli/templates/next-config.ts` — `distDir: "out"`

**Neu (Track-A/B Plan + Presets):**
- `src/cli/presets/catalog.ts` — 6 kuratierte `DIRECTION.axm.json`-Presets
- `src/cli/presets/catalog.test.ts` — Tests
- `src/cli/commands/plan-generate-track.ts` — Track-A/B-DAG-Generierung
- Modifikation `src/cli/commands/plan-generate-command.ts` — liest BRIEF statt VISION
- Modifikation `src/cli/commands/direct.ts` — Track A wählt Preset, Track B generiert 3 Directions

**Neu (Referenzprojekte als Fixtures):**
- `src/cli/fixtures/track-a-campaign/` — Brief, Directions, Patterns, Perf-Scenario, E2E
- `src/cli/fixtures/track-b-portfolio/` — Brief, Directions, Components, Perf-Scenario, E2E
- `src/cli/fixtures/shared/` — gemeinsame Hilfsfunktionen

**Neu (S-20 E2E):**
- `src/cli/commands/s-20.integration.test.ts` — End-to-End über temporäres Repo

---

## Task 1: Formular-Modul

**Files:**
- Create: `src/cli/schemas/form.ts`
- Create: `src/cli/templates/api/contact.ts`
- Create: `src/cli/templates/components/ContactForm.ts`
- Create: `src/cli/templates/pages/contact.ts`
- Modify: `src/cli/commands/init.ts` — bindet Kontakt-Page + API in Scaffold ein
- Test: `src/cli/commands/form.test.ts`

### Task 1.1: Schema definieren

```typescript
import { z } from "zod/v3";

export const ContactSubmission = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  source: z.string().optional(),
});

export type ContactSubmission = z.infer<typeof ContactSubmission>;
```

Speichern als `src/cli/schemas/form.ts`.

### Task 1.2: API-Route-Template

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ContactSubmission } from "@/schemas/form.js";

export const contactApi = new AppType()
  .post("/api/contact", zValidator("json", ContactSubmission), async (c) => {
    const body = c.req.valid("json");
    // A8: In-Memory-Speicher; v4 kann DB anbinden
    return c.json({ ok: true, received: { name: body.name, email: body.email } });
  });
```

Speichern als `src/cli/templates/api/contact.ts`.

### Task 1.3: Komponenten-Template

```typescript
export function contactFormComponent(): string {
  return `
"use client";
import { useState } from "react";
import { Stage } from "@/core/Stage";
import { useChoreo } from "@/core/useChoreo";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const choreo = useChoreo({ id: "contact-form", reducedMotion: "opacity-only" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setStatus(res.ok ? "ok" : "error");
  }

  return (
    <Stage choreo={choreo} className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="max-w-md w-full space-y-6 p-8">
        <label className="block">
          <span className="text-sm">Name</span>
          <input name="name" required className="w-full border-b bg-transparent py-2" />
        </label>
        <label className="block">
          <span className="text-sm">Email</span>
          <input name="email" type="email" required className="w-full border-b bg-transparent py-2" />
        </label>
        <label className="block">
          <span className="text-sm">Message</span>
          <textarea name="message" required minLength={10} className="w-full border-b bg-transparent py-2" />
        </label>
        <button type="submit" className="px-6 py-3 bg-primary text-primary-fg">
          {status === "submitting" ? "Sending…" : "Send"}
        </button>
        {status === "ok" && <p>Message sent.</p>}
        {status === "error" && <p>Something went wrong.</p>}
      </form>
    </Stage>
  );
}
`;
}
```

Speichern als `src/cli/templates/components/ContactForm.ts`.

### Task 1.4: Page-Template

```typescript
export function contactPageTemplate(): string {
  return `
import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  return <ContactForm />;
}
`;
}
```

Speichern als `src/cli/templates/pages/contact.ts`.

### Task 1.5: Scaffold-Integration

Modifiziere `src/cli/commands/init.ts`, sodass bei `atl init` automatisch `app/contact/page.tsx` und `app/api/contact/route.ts` geschrieben werden, falls `content.sections` "contact" enthält (Default: true).

### Task 1.6: Test

```typescript
import { describe, it, expect } from "vitest";
import { ContactSubmission } from "@/cli/schemas/form.js";

describe("ContactSubmission", () => {
  it("accepts valid input", () => {
    expect(ContactSubmission.safeParse({ name: "A", email: "a@b.co", message: "Hello world" }).success).toBe(true);
  });
  it("rejects short message", () => {
    expect(ContactSubmission.safeParse({ name: "A", email: "a@b.co", message: "Hi" }).success).toBe(false);
  });
});
```

Speichern als `src/cli/commands/form.test.ts`.

---

## Task 2: Build-Stage + dist/out-Alignment

**Files:**
- Create: `src/cli/pipeline/stages/build.ts`
- Create: `src/cli/pipeline/stages/build.test.ts`
- Modify: `src/cli/pipeline/types.ts`
- Modify: `src/cli/pipeline/select-stages.ts`
- Modify: `src/cli/templates/next-config.ts`
- Modify: `src/cli/commands/deploy.ts`

### Task 2.1: Stage implementieren

```typescript
import { execa } from "execa";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";

export async function runBuildStage(cwd: string): Promise<StageResult> {
  try {
    await execa("pnpm", ["build"], { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, packet: buildPipelinePacket("AXM-G000", message, "package.json", 1, 1, "perf", ["I-18"]) };
  }
}
```

Speichern als `src/cli/pipeline/stages/build.ts`.

### Task 2.2: Stage registrieren

In `src/cli/pipeline/types.ts`:
```typescript
export type StageName = "generate" | "validate" | "contract" | "typecheck" | "lint" | "build" | "unit" | "e2e" | "perf" | "critic";
```

In `src/cli/pipeline/select-stages.ts`:
```typescript
import { runBuildStage } from "@/cli/pipeline/stages/build.js";

export const STAGES: Stage[] = [
  { name: "validate", run: runValidateStage },
  { name: "contract", run: runContractStage },
  { name: "typecheck", run: runTypecheckStage },
  { name: "lint", run: runLintStage },
  { name: "build", run: runBuildStage },
  { name: "unit", run: runUnitStage },
  { name: "e2e", run: runE2eStage },
  { name: "perf", run: runPerfStage },
  { name: "critic", run: runCriticStage },
];
```

### Task 2.3: next.config.ts anpassen

In `src/cli/templates/next-config.ts` ändere `distDir: "dist"` zu `distDir: "out"`.

### Task 2.4: Deploy nutzt Build-Stage

Modifiziere `src/cli/commands/deploy.ts`, sodass `deploy` zuerst `runBuildStage` aufruft, bevor Vercel deployt.

### Task 2.5: Test

```typescript
import { describe, it, expect, vi } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBuildStage } from "@/cli/pipeline/stages/build.js";

vi.mock("execa", () => ({ execa: vi.fn() }));
import { execa } from "execa";

describe("runBuildStage", () => {
  it("returns ok when pnpm build succeeds", async () => {
    vi.mocked(execa).mockResolvedValueOnce({} as never);
    const dir = mkdtempSync(join(tmpdir(), "b-"));
    const r = await runBuildStage(dir);
    expect(r.ok).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});
```

Speichern als `src/cli/pipeline/stages/build.test.ts`.

---

## Task 3: Track-A/B Plan + Curated Presets

**Files:**
- Create: `src/cli/presets/catalog.ts`
- Create: `src/cli/presets/catalog.test.ts`
- Create: `src/cli/commands/plan-generate-track.ts`
- Modify: `src/cli/commands/plan-generate-command.ts`
- Modify: `src/cli/commands/direct.ts`

### Task 3.1: Preset-Katalog

Erstelle 6 `DIRECTION.axm.json`-Presets (2 slow, 2 mid, 2 fast) mit vollständigen Token-Entwürfen, Typografie, Farbwelt, Motion-Personality. Speichere in `src/cli/presets/catalog.ts` als Array.

### Task 3.2: Track-A-DAG

Wenn `BRIEF.track === "curated"`, wähle Preset passend zu `mood.words`/`antiWords` und `webglAppetite`, erzeuge Orders für: Direction-Preset → Tokens Build → Motion Build → Pattern-Komposition → Build → E2E → PERF → CRITIC.

### Task 3.3: Track-B-DAG

Wenn `BRIEF.track === "bespoke"`, erzeuge Orders für: Brief-Review → Direction-Generate (3 Kandidaten) → Operator-Veto → Style-Tile → Tokens Build → Motion Build → Custom Components → Build → E2E → PERF → CRITIC.

### Task 3.4: Plan-Command anpassen

`src/cli/commands/plan-generate-command.ts` soll `BRIEF.axm.json` lesen und `buildTrackPlan({ brief, cwd })` aufrufen.

### Task 3.5: direct generate track-aware machen

`src/cli/commands/direct.ts`: bei Track A Preset auswählen und als einzige Direction einfrieren; bei Track B 3 Beispiel-Directions generieren (wie bisher, aber mit Bezug zum Brief).

---

## Task 4: Track-A Kampagnen-Page Fixture

**Files:**
- Create: `src/cli/fixtures/track-a-campaign/brief.json`
- Create: `src/cli/fixtures/track-a-campaign/DIRECTION.axm.json`
- Create: `src/cli/fixtures/track-a-campaign/MOTION.axm.json`
- Create: `src/cli/fixtures/track-a-campaign/tokens.json`
- Create: `src/cli/fixtures/track-a-campaign/app/page.tsx`
- Create: `src/cli/fixtures/track-a-campaign/app/layout.tsx`
- Create: `src/cli/fixtures/track-a-campaign/app/globals.css`
- Create: `src/cli/fixtures/track-a-campaign/perf/home.perf.json`
- Create: `src/cli/fixtures/track-a-campaign/e2e/smoke.spec.ts`

Inhalt: Hero mit `preloader-counter`, `distortion-media`-Pattern für Hero-Media, `marquee-velocity` für Laufschrift, `magnetic-cta` für Conversion. Kein Systemfont, keine Default-Tailwind-Palette, Custom-Easings in MOTION. CRITIC sollte ≥ 4/5 auf `directionalFidelity` und `antiTemplate` erreichen.

---

## Task 5: Track-B Portfolio-Bespoke Fixture

**Files:**
- Create: `src/cli/fixtures/track-b-portfolio/brief.json`
- Create: `src/cli/fixtures/track-b-portfolio/DIRECTION.axm.json`
- Create: `src/cli/fixtures/track-b-portfolio/MOTION.axm.json`
- Create: `src/cli/fixtures/track-b-portfolio/tokens.json`
- Create: `src/cli/fixtures/track-b-portfolio/app/page.tsx`
- Create: `src/cli/fixtures/track-b-portfolio/app/layout.tsx`
- Create: `src/cli/fixtures/track-b-portfolio/app/globals.css`
- Create: `src/cli/fixtures/track-b-portfolio/perf/home.perf.json`
- Create: `src/cli/fixtures/track-b-portfolio/e2e/smoke.spec.ts`

Inhalt: WebGL `flowmap-hero` mit mausgesteuertem Fluid-Trail, `depth-gallery` für Work-Sektion, `page-mask-transition` für Navigation, `cursor-system`. Eigene Variable-Font, eigenes Farbkonzept, Custom-Easings. CRITIC ≥ 4/5.

---

## Task 6: S-20 End-to-End-Abnahme

**Files:**
- Create: `src/cli/commands/s-20.integration.test.ts`

Testfahrplan:
1. Temporäres Repo mit `atl init <name>` scaffolden.
2. `BRIEF.axm.json` mit 2 Referenz-URLs und `webglAppetite: 2` schreiben.
3. `atl brief validate` → OK.
4. `atl plan` → Track-B-DAG mit Directions.
5. `atl direct generate` → 3 Directions.
6. `atl direct choose dir_A` → Freeze.
7. `atl tokens build` + `atl motion build`.
8. Patterns/Komponenten hinzufügen (oder Fixture-Page kopieren).
9. `atl pipeline run` → GREEN.
10. `atl deploy --env preview` → URL.
11. CRITIC-Report lesen → `directionalFidelity >= 4` und `antiTemplate >= 4`.
12. Dasselbe über MCP-Tool `atelier_pipeline_run` + `atelier_deploy` wiederholen.

Mock Vercel via `AXIOM_DEPLOY_MOCK_URL=http://localhost:3000`.

---

## Task 7: Dokumentation

**Files:**
- Create: `docs/superpowers/plans/2026-07-12-atelier-a8-acceptance.md`
- Update: `docs/superpowers/specs/2026-07-08-axiom-m0-m6-design.md` oder neues Spec-Dokument für P1-Lücken und Operator-Entscheidungen.

---

## Spec-Coverage-Check

| Spec-Kapitel | Task |
|---|---|
| §5.1 BRIEF | Bestehend, wird in S-20 genutzt |
| §5.2 DIRECTION (3 Routen, Veto, Freeze) | Task 3.4, Task 3.5 |
| §5.3 DESIGN SYSTEM Tokens v3 | Bestehend, wird in Fixtures genutzt |
| §5.4 MOTION LANGUAGE | Bestehend, wird in Fixtures genutzt |
| §6 CRITIC-Stage | A7, wird in S-20 geprüft |
| §8 Pattern-Library | A5/A6, wird in Fixtures genutzt |
| §9 Asset-Pipeline | A6, optional für Track-B-Font |
| §11 CLI-Ergänzungen | Task 1, Task 2, Task 3 |
| S-20 Gesamtabnahme | Task 6 |

Keine Placeholder: jeder Task hat Dateipfade und konkrete Implementierungsvorgaben.
