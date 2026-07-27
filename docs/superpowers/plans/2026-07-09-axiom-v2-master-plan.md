# AXIOM v2.0 Master-Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Jede Phase wird als eigener Plan mit konkreten Tasks ausgeführt.

**Goal:** AXIOM Framework v2.0 (M0–M12) vollständig implementieren, alle harten Abnahmekriterien grün.

**Architecture:** Auf dem bestehenden `feat/m2`-Worktree aufbauen (M0/M1 grün, CLI und Generatoren vorhanden). Zuerst M4 stabilisieren, dann M5/M6 vervollständigen, anschließend M7–M12 phasenweise hinzufügen. Jede Phase endet mit `pnpm build && pnpm test && pnpm run test:integration`.

**Tech Stack:** Node.js 22, pnpm 9, Vite 6, React 19, Tailwind v4, Zustand 5, Zod 4, ts-morph, Vitest 3, Playwright, ESLint 9 Flat, Hono 4, Drizzle ORM, PGlite, proper-lockfile.

**Ausgangszustand (Audit 2026-07-09):**
- M0/M1: grün (`pnpm build`, Unit-Tests, Plugin-Tests passen)
- M2/M3: teilweise, Generatoren + Golden-File existieren
- M4: rot — 10 Integrationstests fehlschlagen
  - `validate.integration.test.ts`: V010 crasht mit STACK_TRACE_ERROR
  - `pipeline.integration.test.ts`: 5 ESLint-abhängige Fixtures + E001 crashen mit Exit 50
  - `heal.integration.test.ts`: 3 Tests scheitern, weil Lint-Stage `eslint.config.js` als Zieldatei liefert
- M5/M6: nicht begonnen
- M7–M12: nicht begonnen

---

## Phase 0 — M4 stabilisieren (sofort)

**Ziel:** `pnpm run test:integration` wird grün; bestehende Unit-Tests bleiben grün.

**Akzeptanzkriterien:**
1. `AXM-V010` in `validate.integration.test.ts` liefert Exit 60 + errorCode `AXM-V010` ohne Crash.
2. Alle Pipeline-Fixtures in `pipeline.integration.test.ts` liefern Exit 0 + RED-Report + korrekten `errorCode`.
3. `axm heal --auto` in `heal.integration.test.ts` löst drei Szenarien korrekt ab.

**Geplante Änderungen (hohe Ebene):**
- `src/cli/validate/lint.ts`: Globale `process.chdir`-Race entfernen, damit parallele Integrationstests sich nicht das cwd kaputt setzen.
- `src/cli/validate/checks.ts` + `content-checks.ts`: Non-ESLint Invarianten-Checks für V001/V004/V005/V006/V008/V009/V012 ergänzen, damit Pipeline-Fixtures auch in uninstalled Apps das korrekte FIX_PACKET liefern.
- `src/cli/pipeline/stages/lint.ts`: Zieldatei auf `src/` beschränken; Config-Dateien (`eslint.config.*`, `vite.config.*`, etc.) filtern.
- `src/cli/pipeline/stages/unit.ts`: JSON-Report robust aus Vitest-stdout extrahieren; Zieldatei relativ zu cwd auflösen; generierte `vitest.config.ts` exkludiert `packages/**`.
- `src/cli/generators/component.ts`: Zero-Prop-Komponenten ohne unbenutzten `_props`-Parameter generieren, damit frisch gescaffoldete Apps wirklich grün sind.
- `src/cli/commands/heal.ts`: Bei unverändertem Target nach Ack ein `CliError` mit Exit 50 werfen (Eskalation), nicht einen generischen Error.
- `packages/eslint-plugin-axiom/src/rules/no-default-export.ts`: `*.config.*`-Dateien ausnehmen, weil Vitest/ESLint/Vite Default-Exports in ihren Config-Dateien erfordern.
- `src/cli/validate/checks.ts`: `AXM-V011` referenziert `I-10` (Ownership-Zone-Hash-Integrität).
- `src/cli/commands/init.test.ts`: `dist/` aus Determinismus-Snapshot ausschließen.
- `vitest.integration.config.ts`: `packages/**` ausschließen.

**Exit-Gate:** `pnpm build && pnpm test && pnpm run test:integration` grün.

---

## Phase 1 — M2/M3 v2-Resolutionen

**Ziel:** §15-Resolutionen aus v2.0 in M0–M6 integrieren.

**Tasks:**
1. **I-13 (`data-axm-id`)**: Komponenten-Template generiert `data-axm-id="<Name>"`; ESLint-Regel `axiom/require-axm-id` erzwingt es; Playwright-Helfer `axmSelect` im Core.
2. **Tailwind-v4-Theme (§15.1)**: `axm tokens build` erzeugt `src/generated/theme.css` mit CSS-Custom-Properties + `@theme inline`-Block; Golden-File-Test.
3. **Contract-Block-Hashing (§15.2)**: Test-Marker `// @axiom:contract:start sha256:<hash>` … `// @axiom:contract:end` parsen/validieren (M3/M7 Grenze).
4. **heal-Ack-Semantik (§15.3)**: Bereits in Phase 0 aktiv; hier nur Dokumentation/Spec-Abgleich.
5. **Default-Export-Stubs**: Route-Wrapper dürfen Default-Exports sein (I-04 Ausnahme); aktuelles Template prüfen.

**Exit-Gate:** Unit + Integration grün; neue Golden-Files passen.

---

## Phase 2 — M5: Context Economy + Split

**Ziel:** `axm context slice --for <file>` und `axm split` implementieren.

**Tasks:**
1. Schema `agent-context.json` erweitern: `sig-index`, `slice-cache` Pfade (v2 §11.2).
2. `src/cli/commands/context.ts`: `slice`-Subcommand; Signatur-Index aus `.axiom/sig-index.json`; Dependency-Graphen aus `agent-context.json` + Imports.
3. Token-Budget-Logik: Default 8.000 Tokens; Warnung bei 6.000; `--for-order` Budget aus Order.
4. `src/cli/commands/split.ts`: Extrahiert Export oder Zeilenblock in neue Datei; aktualisiert Manifest (`components`/`routes`/`stores`) und Import-Pfade.
5. Integrationstest: 30-Komponenten-Fixture-Repo; Slice < 8.000 Tokens; Split bleibt kompilierbar.

**Exit-Gate:** `axm context slice` und `axm split` Integrationstests grün.

---

## Phase 3 — M6: E2E/a11y + Agenten-Doku

**Ziel:** Playwright + axe-core als Pipeline-Gate; S-06 grün; `CLAUDE.md` + `.cursorrules` generiert.

**Tasks:**
1. `src/cli/templates/e2e/`: Playwright-Config + Beispiel-Spec mit `axe-core`.
2. `src/cli/pipeline/stages/e2e.ts`: axe-core-Ergebnisse parsen; `AXM-E010` für a11y-Verstöße.
3. `axm init`: generiert `CLAUDE.md` und `.cursorrules` aus aktuellem Kontext (v1; v2-Erweiterungen folgen in M8).
4. S-06-Integrationstest: Prompt-to-Code mit Route, Header, Card-Grid, Button.

**Exit-Gate:** `pnpm test:e2e` und S-06-Integration grün.

---

## Phase 4 — M7: API- & Datenschicht

**Ziel:** Contract-first API: `defineContract`, `axm api add/build`, Drizzle + PGlite, Migrationen, Stage CONTRACT.

**Tasks:**
1. Schemas: `contract.ts`, `endpoint.ts`, `db.ts` in `agent-context.json`.
2. `src/cli/api/contract.ts`: `defineContract` helper.
3. `src/cli/commands/api.ts`: `add`, `build` Subcommands; generiert Handler-Stubs, OpenAPI, Client.
4. `src/cli/commands/db.ts`: `migrate gen`, `migrate apply`, `seed`.
5. `src/cli/pipeline/stages/contract.ts`: Prüft Handler-Signaturen, Client-Hash, I-14/I-15.
6. Templates: `api/contracts/`, `api/handlers/`, `db/schema/`, `db/migrations/`.
7. Fixtures: manipulierte Migration → `AXM-D002`; Raw-fetch in Komponente → `AXM-C002`.

**Exit-Gate:** Contract-Integrationstests grün.

---

## Phase 5 — M8: Intent-Layer

**Ziel:** `VISION.axm.json`, `axm plan`, Veto-Gates, `replan --delta`.

**Tasks:**
1. Schema `VISION.axm.json` + `work-order.schema.json`.
2. `src/cli/commands/plan.ts`: Dekompositions-Regelwerk (§10); erzeugt `orders/open/` + DAG in Manifest.
3. `axm plan approve/reject` und `axm plan replan --delta`.
4. Golden-File-Test: identische Vision ⇒ byte-identischer Order-Satz.
5. Fixtures: Entitätszyklus → `AXM-P002`; Budget-Ceiling → `AXM-P003`.

**Exit-Gate:** S-07 grün.

---

## Phase 6 — M9: Multi-Agent-Orchestrierung

**Ziel:** Lease-Protokoll, Mutex-Claims, Heartbeat, Reclaim, I-17, `axm conduct`.

**Tasks:**
1. `.axiom/leases.json` + proper-lockfile-basierter Manifest-Mutex.
2. `src/cli/commands/order.ts`: `list`, `claim`, `complete`, `release`.
3. `src/cli/commands/lease.ts`: `list`, `heartbeat`, `reclaim`.
4. `src/cli/commands/conduct.ts`: Dispatcher-Loop, Zuteilungsempfehlungen.
5. I-17 Enforcement: jeder Schreibbefehl prüft Lease des aufrufenden `--agent`.
6. Property-Test: 8 Agenten × 200 Claims auf 40 Orders → null Doppel-Leases.

**Exit-Gate:** S-08, S-09 grün.

---

## Phase 7 — M10: Ledger + Token-Ökonomie v2

**Ziel:** `axm ledger`, Q-Enforcement, sig-index, Slice-Cache, Kosten-Ledger.

**Tasks:**
1. `ledger/decisions.ndjson` + `src/cli/commands/ledger.ts`: `add`, `query`.
2. `src/cli/validate/ledger.ts`: enforced-rule Typen (`forbidden-dependency`, `forbidden-import-path`, `required-token-usage`, `forbidden-api-pattern`).
3. `.axiom/sig-index.json` + `.axiom/slice-cache/`
4. `src/cli/context/slice.ts`: Cache-Hit-Logik, Slice-Latenz < 200 ms.
5. `pipeline/bench/cost.ndjson`: Kosten-Ledger.
6. Fixture: `dayjs`-Import → `AXM-Q001` mit `ledgerRefs`.

**Exit-Gate:** S-10 grün; Slice-Performance-Test grün.

---

## Phase 8 — M11: Security + CI/CD + Deploy

**Ziel:** `axm audit`, `axm deps add`, `axm deploy`, GitHub Actions, Headless-Heal.

**Tasks:**
1. `.npmrc`: `save-exact=true`, `ignore-scripts=true`.
2. `src/cli/commands/audit.ts`: exakte Versionen, Lockfile-Hash, Postinstall-Scripts.
3. `src/cli/commands/deps.ts`: `add` mit Ledger-Prüfung + Manifest-Hash-Update.
4. `src/cli/commands/deploy.ts`: `preview`/`prod`; Veto-Gate `pre-deploy`; Vercel-Wrapper.
5. Template `.github/workflows/axiom.yml` + Headless-Heal-Job.
6. Fixtures: `^` in package.json → `AXM-S001`; Lockfile-Drift → `AXM-S003`.

**Exit-Gate:** S-11 grün; CI-Workflow auf Fixture-Repo grün.

---

## Phase 9 — M12: Visual Gate + AXIOM-Bench + Gesamtabnahme

**Ziel:** Deterministisches Pixel-Diffing, Bench-Metriken, S-12.

**Tasks:**
1. Visual-Stage (opt-in) mit Playwright-Screenshot + odiff; Baseline-Verwaltung.
2. Font-Pinning (Inter lokal), Viewport-Fix, Animationen aus im Test-Modus.
3. `src/cli/commands/bench.ts`: `run --fixture S|M|L`; Bench-Report `pipeline/bench/`.
4. Fixture-Visionen S/M/L.
5. S-12: Prompt-to-Product mit 4 Workern; GreenRate@1 ≥ 0,80.

**Exit-Gate:** S-12 grün; Bench-Report dokumentiert.

---

## Globale Invarianten (für alle Phasen)

- Max. 120 LOC / 4096 Bytes pro Quelldatei (I-01/I-02) — bei Überschreitung `axm split` verwenden.
- Keine Default-Exports (außer generierte Route-Wrapper).
- Keine Barrel-Files.
- Keine `any`-Typen, kein `@ts-ignore`, kein `eslint-disable`.
- Imports absolut via `@/`.
- Jede Komponente/Datei mit Sidecar (wo gefordert).
- Jeder CLI-Output NDJSON; jeder Fehler FIX_PACKET.

## Dokumentation

- Spezifikation: `docs/superpowers/specs/2026-07-09-axiom-v2-design.md`
- Phasen-Pläne: `docs/superpowers/plans/2026-07-09-axiom-v2-phase-*.md`
- Bench-Reports: `pipeline/bench/`
