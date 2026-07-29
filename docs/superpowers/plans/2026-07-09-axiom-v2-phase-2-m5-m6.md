# Phase 2 — M5 Context Economy + M6 E2E/a11y + Agenten-Doku

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** `axm context slice --for <file>` und `axm split` implementieren; E2E-Stage mit axe-core; S-06 grün; `CLAUDE.md` + `.cursorrules` werden generiert statt statisch kopiert.

**Architecture:** Auf dem stabilen `feat/m2`-Worktree (M4 + Phase 1 grün) aufbauen. M5 nutzt das vorhandene `agent-context.json` als Dependency-Graph. M6 erweitert die Pipeline-E2E-Stage und die `init`-Templates.

---

## Task 1: `axm context slice --for <file>` implementieren

**Files:**
- Create: `src/cli/commands/context.ts`
- Modify: `src/cli/bin.ts`
- Test: `src/cli/commands/context.integration.test.ts`

**Verhalten:**
1. Liest `agent-context.json`.
2. Bestimmt den Eintrag zu `--for <file>` (Komponente, Route oder Store).
3. Sammelt den minimalen Bearbeitungskontext:
   - Zieldatei (vollständiger Inhalt)
   - Sidecar (`<Name>.spec.json`)
   - Test-Datei
   - Direkte `dependsOn`-Komponenten (nur Dateiname + Sidecar, kein tieferer Graph in M5)
   - Direkte `usedBy`-Komponenten (nur Dateiname + Sidecar)
   - `tokens.json` (gekürzt: nur verwendete Token-Kategorien, falls identifizierbar; sonst gesamte Datei)
   - `agent-context.json` (nur relevanter Eintrag, nicht das ganze Manifest)
4. Zählt Tokens (naive Schätzung: `JSON.stringify(slice).length / 4`).
5. Output als NDJSON:
   ```json
   {"ok":true,"target":"src/components/Button.tsx","tokenCount":1234,"files":[{"path":"...","content":"..."}]}
   ```
6. Wenn `tokenCount > project.tokenBudget.hardLimitPerSlice`, Exit 40 mit FIX_PACKET `AXM-B001`.
7. Optional `--for-order <orderId>` (Stub für M8): Budget aus Order.

**Token-Budget:**
- Default `hardLimitPerSlice: 8000`, `warnAt: 6000` (bereits im Context-Schema).
- Warnung bei > 6000 Tokens als `warning` im Output, aber kein Exit.

**Constraints:** Kein `any`, keine Default-Exports.

---

## Task 2: 30-Komponenten-Fixture + Slice-Integrationstest

**Files:**
- Create: `src/cli/commands/context.integration.test.ts`

**Verhalten:**
1. Scaffolded App mit `axm init`.
2. Loop: 30 Komponenten hinzufügen (`Component_0` … `Component_29`), wobei `Component_i` von `Component_{i-1}` abhängt (`dependsOn`).
3. `axm context slice --for src/components/Component_29.tsx` ausführen.
4. Erwartung: Exit 0, `tokenCount < 8000`.

**Optimierung:** Für die 30-Komponenten-Kette darf `slice` nicht alle 30 Dateien vollständig inkludieren (sonst über Budget). Lösung: In M5 nur direkte Nachbarn (1 Hop) inkludieren; vollständige Tiefe-2-Ketten können in M10 mit sig-index optimiert werden.

---

## Task 3: `axm split <file> --at <export|line>` implementieren

**Files:**
- Create: `src/cli/commands/split.ts`
- Modify: `src/cli/bin.ts`
- Test: `src/cli/commands/split.integration.test.ts`

**Verhalten:**
1. `--at <exportName>`: Export aus `<file>` in neue Datei `src/components/<ExportName>.tsx` verschieben.
   - Originaldatei: Export entfernen, stattdessen `import { <ExportName> } from "@/components/<ExportName>";` hinzufügen, falls der Export intern verwendet wurde.
   - Neue Datei: `export function <ExportName>(...) { ... }` mit Sidecar + Test.
   - Manifest: Neuen Komponenten-Eintrag hinzufügen; `dependsOn`/`usedBy` aktualisieren.
2. `--at <line>`: Block ab Zeile in neue Datei verschieben (M5-Scope: nur Komponenten-Exporte; Zeilen-Split als Stub).
3. Nach dem Split muss `axm validate` grün sein.

**Constraints:** Kein `any`, keine Default-Exports, Imports bleiben absolut via `@/`.

---

## Task 4: E2E-Stage mit axe-core

**Files:**
- Create: `src/cli/templates/e2e/example.spec.ts`
- Modify: `src/cli/pipeline/stages/e2e.ts`
- Modify: `src/cli/templates/app.ts`
- Test: `src/cli/pipeline/stages/e2e.test.ts` erweitern

**Verhalten:**
1. Generierte App enthält `e2e/smoke.spec.ts` mit axe-core-Check auf `/`.
2. `runE2eStage` parsed Playwright-JSON-Report.
3. Bei a11y-Verstoß (`violations.length > 0`): FIX_PACKET `AXM-E010`, invariants `["I-13"]` (E2E-Selektoren) + `["I-09"]` (keine a11y-Ignoranz).

**S-06-Scope:** Header, Card-Grid, Button auf einer Route; Playwright-Spec prüft Render + axe.

---

## Task 5: Generierte Agenten-Doku

**Files:**
- Modify: `src/cli/templates/docs.ts`
- Modify: `src/cli/commands/init.ts`

**Verhalten:**
`axm init` generiert `.cursorrules` und `CLAUDE.md` aus dem aktuellen Kontext statt statische Templates zu kopieren. Inhalt:
- Projektname, Stack, Invarianten-Liste (I-01…I-13)
- Order-/Lease-Protokoll (Stub für M8/M9)
- "Frag das Ledger, bevor du entscheidest."

---

## Task 6: S-06 Integrationstest

**Files:**
- Create: `src/cli/commands/s-06.integration.test.ts` (oder in `add.integration.test.ts`)

**Verhalten:**
1. `axm init` → App.
2. `axm add component Header`, `Card`, `Button`, `CardGrid`.
3. `axm add route / --component CardGrid`.
4. `pnpm build` grün.
5. `axm pipeline run` grün.
6. `pnpm test:e2e` grün (oder via Pipeline-E2E-Stage).

---

## Exit-Gate Phase 2

- `pnpm build && pnpm test && pnpm run test:integration` grün.
- `axm context slice` Integrationstest: 30-Komponenten-Repo < 8000 Tokens.
- `axm split` Integrationstest: Split bleibt valide.
- S-06 grün.
