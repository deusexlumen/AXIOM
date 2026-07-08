# AXIOM — Gesamt-Design M0–M6

> **Status:** Design approved  
> **Source:** `AXIOM_SPEC_v1.0.md` (BUILD-READY)  
> **Approach:** Streng sequenzielle Meilensteine M0 → M6; jeder Meilenstein GREEN bevor der nächste beginnt.

---

## 1. Ziel & Scope

**Ziel:** Ein deterministisches, agenten-natives Framework für React-Web-SPAs bauen, bei dem ein KI-Agent ausschließlich über `axm`-Befehle und manifestgesteuerte Kontext-Slices arbeitet, ohne das Repository explorieren zu müssen.

**Scope v1:**
- Manifest-SSOT (`agent-context.json`).
- CLI `axm` mit NDJSON-Vertrag.
- Invarianten-Enforcement (I-01…I-12).
- Self-Healing-Pipeline mit FIX_PACKETs.
- Codegen für Komponenten, Routen und Stores.
- Context-Slicer und Split-Tool.

**Nicht-Ziele v1 (laut Spezifikation):**
- Kein SSR/Backend.
- Kein Multi-Agent-Locking.
- Keine visuelle Regression (Pixel-Diffs).
- Kein Plugin-System.

---

## 2. Architektur

Vier Subsysteme bilden das Framework:

1. **Manifest-Kern** — `agent-context.json` als Single Source of Truth; Zod-Schemas für Komponenten, Tokens, Framework-Config und FIX_PACKETs.
2. **CLI `axm`** — Die einzige M2M-Schnittstelle. Jeder Befehl akzeptiert implizit `--json`, Output = NDJSON.
3. **Invarianten-Enforcement** — Custom ESLint-Plugin `eslint-plugin-axiom` plus `axm validate`.
4. **Self-Healing-Pipeline** — State Machine mit FIX_PACKET-Normalisierung für TypeScript, ESLint, Vitest und Playwright.

**Tech-Stack:**

| Layer | Entscheidung |
|-------|--------------|
| Runtime | Node.js 22 LTS |
| Package Manager | pnpm 9 |
| Build Tool | Vite 6 |
| UI Library | React 19 (Function Components only) |
| Styling | Tailwind v4, Theme aus `tokens.json` |
| State | Zustand 5 |
| Schema/Validation | Zod 4 |
| AST-Codemods | ts-morph |
| Unit Tests | Vitest 3 (`--reporter=json`) |
| E2E Tests | Playwright (`--reporter=json`) + axe-core |
| Linting | ESLint 9 Flat Config + `eslint-plugin-axiom` |
| Language | TypeScript 5.x, `strict: true`, `noUncheckedIndexedAccess: true` |

---

## 3. Meilensteine & Goals

| MS | Goal | Deliverables | Akzeptanzkriterium (hart) |
|---|---|---|---|
| **M0** | Ein reproduzierbares Repo-Skeleton mit funktionierendem Build. | `axm init`, `package.json`, `tsconfig.json`, `vite.config.ts`, Tailwind-Setup, Ordnerstruktur §3 der Spezifikation. | `pnpm build` grün auf frischem Scaffold. |
| **M1** | Der Manifest-Kern als SSOT. | Zod-Schemas → JSON-Schema, `agent-context.json` Reader/Writer, Hash-Integrität. | Property-Test: 1.000 zufällige Mutationen via API → Manifest stets schema-valide. |
| **M2** | Alle Invarianten maschinell erzwungen. | `eslint-plugin-axiom` mit Regeln für I-01…I-12, `axm validate` inkl. Ownership. | Jede Invariante hat einen Verstoß-Fixture-Test, der Exit 10/60 + korrekten Fehlercode liefert. |
| **M3** | Deterministische Codegen für Komponenten, Routen, Stores. | `axm add component/route/store`, ts-morph-Codemods, Templates §8. | Golden-File-Tests: identischer Input → byte-identischer Output. |
| **M4** | Pipeline und FIX_PACKET-System. | State Machine, Fehler-Normalisierung, `axm heal`. | 10 präparierte Fehler-Fixtures → 10 schema-valide FIX_PACKETs mit korrektem `errorCode`. |
| **M5** | Kontext-Ökonomie. | `axm context slice`, `axm split`, Token-Schätzung. | Slice eines 30-Komponenten-Demo-Repos bleibt < 8.000 Tokens; `axm split` erzeugt kompilierende Ergebnisse. |
| **M6** | E2E, a11y-Gate und Agenten-Docs. | Playwright-Integration, axe-Gate, `CLAUDE.md`/`.cursorrules`-Generator. | Abnahmeszenario S-06 grün. |

---

## 4. Repository-Layout

```
axiom-app/
├── axiom.config.json          # LOCKED      — Framework-Konfiguration
├── agent-context.json          # MACHINE     — Single Source of Truth
├── tokens.json                 # OPERATOR    — Design-Tokens
├── .cursorrules                # MACHINE     — Generierte Agenten-Regeln
├── CLAUDE.md                   # MACHINE     — Generiertes Agenten-Onboarding
├── src/
│   ├── core/                   # LOCKED      — Framework-Runtime
│   ├── components/             # AGENT       — Agenten-Schreibzone
│   ├── routes/                 # MACHINE     — Nur via CLI generierbar
│   ├── state/                  # AGENT       — Zustand-Stores
│   └── generated/              # MACHINE     — Generierte Artefakte
├── pipeline/
│   ├── fix-packets/            # MACHINE     — FIX_PACKET-Archiv
│   └── reports/                # MACHINE     — Test-/Lint-Reports
└── e2e/                        # AGENT       — Playwright-Specs
```

**Ownership-Zonen:**
- **LOCKED:** Nur Framework-Updates. Agenten-Schreibversuch → `AXM-V010`.
- **MACHINE:** Nur `axm`-CLI. Direkter Edit → Hash-Mismatch `AXM-V011`.
- **AGENT:** Freie Schreibzone unter Invarianten-Enforcement.
- **OPERATOR:** Mensch editiert; Agent nur via explizitem CLI-Befehl.

---

## 5. Datenfluss & State Machine

```
            ┌────────────────────────────────────────────────┐
            │                                                │
GENERATE ──► VALIDATE ──► TYPECHECK ──► LINT ──► UNIT ──► E2E ──► GREEN
   ▲            │RED          │RED        │RED     │RED     │RED
   │            ▼             ▼           ▼        ▼        ▼
   │         ┌──────────────────────────────────────────────┐
   │         │  EMIT FIX_PACKET (append pipeline/fix-packets)│
   │         └──────────────────────────────────────────────┘
   │            │ attempt < maxRetries          │ attempt ≥ maxRetries
   └────────────┘                               ▼
     (Agent konsumiert Packet,            ESCALATE → Operator-Report,
      korrigiert, Pipeline re-runt)        Komponente bleibt RED,
                                           Pipeline für Scope gesperrt
```

- **Fail-fast:** Stoppt an der ersten roten Stage.
- **Scope-Isolation:** `--scope <component>` testet nur die Komponente + `usedBy`-Kette.
- **Retry-Hygiene:** Jedes FIX_PACKET enthält `lastAttemptDiff` und `attempt.current/max`.
- **E2E-Gate:** Läuft nur bei Route-Änderungen oder explizit `--stage e2e`.

---

## 6. Fehlerbehandlung

### 6.1 FIX_PACKET-Schema

```json
{
  "packetId": "run_0043_p1",
  "runId": "run_0043",
  "attempt": { "current": 2, "max": 3 },
  "errorCode": "AXM-U001",
  "stage": "unit",
  "severity": "BLOCKING",
  "target": { "component": "Button", "file": "src/components/Button.tsx", "line": 34, "column": 12 },
  "message": "Expected aria-disabled='true' when disabled prop is set",
  "rawEvidence": { "stacktrace": "...", "testName": "...", "excerpt": { "startLine": 29, "endLine": 39, "code": "..." } },
  "probableCause": "...",
  "fixHint": "...",
  "lastAttemptDiff": "...",
  "contextSlice": { "command": "axm context slice --for src/components/Button.tsx", "estimatedTokens": 2741 },
  "invariantsAffected": ["I-07"],
  "agentInstruction": "Korrigiere NUR target.file. Ändere NICHT den Test. Ändere NICHT das Sidecar."
}
```

### 6.2 Fehlercode-Taxonomie

| Prefix | Klasse |
|---|---|
| `AXM-Vxxx` | Validierung/Invarianten |
| `AXM-Txxx` | TypeScript |
| `AXM-Lxxx` | Lint |
| `AXM-Uxxx` | Unit-Test |
| `AXM-Exxx` | E2E/a11y |
| `AXM-Bxxx` | Budget |
| `AXM-Ixxx` | Intern |

### 6.3 Exit-Codes

| Code | Bedeutung |
|------|-----------|
| 0 | OK |
| 10 | Validierungsfehler |
| 20 | TypeScript-Fehler |
| 30 | Testfehler |
| 40 | Budget überschritten |
| 50 | Interner Framework-Fehler |
| 60 | Ownership-Verletzung |

---

## 7. Teststrategie

- **Determinismus-Tests:** `axm init` und `axm add component` erzeugen bei identischem Input byte-identische Dateien.
- **Invarianten-Fixtures:** Jede Invariante I-01…I-12 hat eine Verstoß-Fixture, die Exit 10/60 + korrekten Fehlercode liefert.
- **Golden-File-Tests:** Codegen-Output ist stabil und vergleichbar.
- **Fehler-Fixtures:** 10 präparierte Fehler → 10 schema-valide FIX_PACKETs.
- **E2E-Abnahme:** Szenario S-06 (Prompt-to-Code) muss GREEN werden.

---

## 8. Risiken & offene Punkte

| ID | Thema | Risiko | Mitigation |
|---|---|---|---|
| P1 | Tailwind-v4-`@theme`-Generierung aus `tokens.json` | API-Änderung/Drift | CSS-Custom-Properties-only Fallback vorsehen |
| P1 | Contract-Block-Hashing in Testdateien | Marker-Parser-Stabilität | Marker-Syntax `// @axiom:contract:start/end` vor M3 festzurren |
| P2 | `axm heal --auto`-Watcher-Semantik | Debounce/Korrektur-Signal | `pipeline/ack/<packetId>` als Fertig-Signal evaluieren |
| P2 | E2E-Selektorstrategie | Fragile Selektoren | `data-axm-id` als generiertes Pflicht-Attribut prüfen (Kandidat I-13) |

---

## 9. Nächster Schritt

Dieses Design wird durch den `writing-plans`-Skill in einen detaillierten, abarbeitbaren Implementierungsplan für Meilenstein **M0** überführt. Jeder weitere Meilenstein bekommt einen eigenen Plan nach demselben Rhythmus.
