# AGENTS.md — AXIOM

> Diese Datei richtet sich an autonome Coding-Agenten. Sie fasst den aktuellen Projektstand, den geplanten Stack, die Repository-Struktur und die Arbeitsregeln zusammen, die aus der vorliegenden Projektspezifikation ablesbar sind.

## Projekt-Übersicht

AXIOM ist ein Framework für eine deterministische, agenten-native Web-Infrastruktur. Aktuelle Spezifikationen: `AXIOM_SPEC_v2.0.md` (ersetzt v1.0) und `ATELIER_SPEC_v3.0.md` (ATELIER-Erweiterung: Brief→Direction→Build-Workflow). Die Entwicklung von `feat/m2` ist nach `master` gemergt; `master` ist damit der Integrationsbranch. Der ATELIER Craft Prototype (eigenständige Vite/React-App) liegt unter `apps/craft-prototype/`; der Repo-Root gehört dem AXIOM-Framework.

Implementierungsstand:

- **AXIOM M0–M12** — alle Meilensteine implementiert und GREEN (Repo-Skeleton, Manifest Core, Invarianten-Enforcement, Generatoren, Pipeline/Heal, API/DB-Modul, Deploy, Visual Gate u.a.)
- **ATELIER A0–A7** — GREEN (Acceptance-Reports unter `docs/superpowers/plans/`): Next.js-Scaffold, Tokens v3 + Motion-System, Brief-/Direction-Workflow, Pattern-System, PERF-/BUILD-Stages, CRITIC-Stage mit Anti-Template-Heuristik, MCP-Server `atelier-mcp` (15 Tools)
- **ATELIER A8 / S-20** — Track-A (CURATED Kampagnen-Page) end-to-end GREEN (Commit `c5dde44`, 474s Vollpipeline inkl. Deploy + CRITIC); Track-B (BESPOKE Portfolio) ist der verbleibende offene Teil

Jede Implementierungsarbeit beginnt mit dem Scaffolding gemäß aktueller Spezifikation. Der aktuelle Stand umfasst:

- `axm`-CLI mit funktionsfähigem `axm init <name>` und `axm validate`; zusätzlich die ATELIER-CLI `atl` (gleicher CLI-Vertrag) und der MCP-Server `atelier-mcp`
- Scaffolding für Next.js 15, React 19, TypeScript, Tailwind, GSAP/R3F, Zod, Vitest, Playwright und ESLint
- Manifest-Kern (M1): Zod-Schemas, Reader/Writer, SHA-256-Hashes, Integritätsprüfung, FIX_PACKET-Fehlerformat

## Zentrale Design-Doktrin

- **Determinismus > Eleganz**
- **Maschinenlesbarkeit > menschliche Ergonomie**
- **Ein Weg, keine Optionen**
- Stack-Entscheidungen folgen dem Prinzip der höchsten Trainingsdaten-Abdeckung in aktuellen LLMs, um Halluzinationen zu minimieren.

## Geplanter Technology Stack

| Layer | Entscheidung |
|-------|--------------|
| Runtime | Node.js 22 LTS |
| Package Manager | pnpm 9 |
| Framework/Build | Next.js 15 (App Router, `output: "export"`) — ersetzt seit ATELIER A0 das ursprünglich geplante Vite-6-Setup |
| UI Library | React 19 (ausschließlich Function Components) |
| Motion | GSAP + React Three Fiber, gekapselt in Core-Wrappern (`useChoreo` u.a.), Motion-Tokens aus `MOTION.axm.json` |
| Styling | Tailwind v4, Theme aus `tokens.json` generiert |
| State Management | Zustand 5 |
| Schema/Validation | Zod 4 |
| AST-Codemods | ts-morph |
| Unit Tests | Vitest 3 (`--reporter=json`) |
| E2E Tests | Playwright (`--reporter=json`) + axe-core |
| Linting | ESLint 9 Flat Config + Custom-Plugin `eslint-plugin-axiom` |
| API-Runtime | Hono 4 auf Node.js |
| Datenbank-ORM | Drizzle ORM |
| Lokale DB | PGlite (In-Process Postgres/WASM) |
| Produktions-DB | PostgreSQL (Supabase-kompatibel) |
| API-Vertrag | Zod → OpenAPI 3.1 → generierter Client |
| Sprache | TypeScript 5.x, `strict: true`, `noUncheckedIndexedAccess: true` |

## Repository-Layout (geplant)

```
axiom-app/
├── axiom.config.json          # Framework-Konfiguration (LOCKED)
├── agent-context.json          # Single Source of Truth (MACHINE)
├── tokens.json                 # Design-Tokens (OPERATOR)
├── .cursorrules                # Generierte Agenten-Regeln (MACHINE)
├── CLAUDE.md                   # Generiertes Agenten-Onboarding (MACHINE)
├── src/
│   ├── core/                   # Framework-Runtime (LOCKED)
│   ├── components/             # Agenten-Schreibzone
│   ├── routes/                 # Nur via CLI generierbar (MACHINE)
│   ├── state/                  # Agenten-Schreibzone
│   └── generated/              # Generierte Artefakte (MACHINE)
├── pipeline/
│   ├── fix-packets/            # FIX_PACKET-Archiv
│   └── reports/                # Test-/Lint-Reports
└── e2e/                        # Playwright-Specs (AGENT)
```

### Ownership-Zonen

- **LOCKED:** Nur Framework-Updates ändern diese Dateien. Agenten-Schreibversuch führt zu Pipeline-Abbruch (`AXM-V010`).
- **MACHINE:** Nur die `axm`-CLI mutiert. Direkter Edit führt zu Hash-Mismatch (`AXM-V011`).
- **AGENT:** Freie Schreibzone unter Invarianten-Enforcement.
- **OPERATOR:** Mensch editiert; Agenten nur via expliziten CLI-Befehl.

## Kern-Invarianten (maschinell erzwungen)

| ID | Invariante |
|----|------------|
| I-01 | Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare) |
| I-02 | Max. 4096 Bytes pro Quelldatei |
| I-03 | Genau ein benannter Export pro Komponenten-Datei |
| I-04 | Keine Default-Exports (außer generierte Route-Wrapper) |
| I-05 | Keine Barrel-Files (`index.ts` mit Re-Exports) |
| I-06 | Imports ausschließlich absolut via Alias `@/` |
| I-07 | Jede Komponente besitzt eine Sidecar-Datei `<Name>.spec.json` |
| I-08 | Keine Raw-Farbwerte/Pixel; nur Token-Referenzen |
| I-09 | Kein `any`, kein `@ts-ignore`, kein `eslint-disable` |
| I-10 | Verzeichnisse haben Ownership-Zonen |
| I-11 | Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |
| I-13 | Jede Komponente rendert `data-axm-id="<Name>"` auf dem Root-JSX-Element |

## CLI-Vertrag (`axm`)

Die CLI ist die einzige M2M-Schnittstelle:

- Jeder Befehl akzeptiert implizit `--json`. Output = NDJSON.
- Keine interaktiven Prompts.
- Fehlende Pflichtparameter führen zu Exit 10 mit FIX_PACKET.
- Idempotenz: Zweifacher identischer Aufruf = identisches Ergebnis.

### Geplante Befehle

- `axm init <name>` — Scaffolded das Repo.
- `axm add component <Name> [--spec ...]` — Erzeugt Komponente + Sidecar + Test.
- `axm add route <path> --component <Name>` — Erzeugt Route.
- `axm add store <name> --shape <json>` — Erzeugt Zustand-Store.
- `axm validate [--scope ...]` — Prüft Manifest, Invarianten, Ownership, Token-Referenzen.
- `axm pipeline run [--scope ...] [--stage ...]` — Führt die Pipeline aus.
- `axm context slice --for <file>` — Liefert minimalen Bearbeitungskontext.
- `axm split <file> --at <export|line>` — Extrahiert Teilfunktion in neue Datei.
- `axm tokens build` — Regeneriert Theme und Token-Typen.
- `axm graph [--for <component>]` — Dependency-Graph als JSON.
- `axm heal --auto [--max-retries 3]` — Selbstheilungs-Loop.
- `axm status` — Projekt-Zustand.

### Semantische Exit-Codes

| Code | Bedeutung |
|------|-----------|
| 0 | OK |
| 10 | Validierungsfehler (Schema/Invariante) |
| 20 | TypeScript-Fehler |
| 30 | Testfehler (Unit/E2E) |
| 40 | Budget überschritten (LOC/Bytes/Tokens) |
| 50 | Interner Framework-Fehler |
| 60 | Ownership-Verletzung |

## Build- und Test-Workflow (geplant)

### State-Machine der Pipeline

```
GENERATE → VALIDATE → TYPECHECK → LINT → UNIT → E2E → GREEN
```

- Fail-fast: Stoppt an der ersten roten Stage.
- Max. 3 Retries, danach Eskalation an den Operator.
- Scope-Isolation: `--scope <component>` testet nur die betroffene Komponente + `usedBy`-Kette.
- E2E läuft nur bei Route-Änderungen oder explizit `--stage e2e`.

### Befehle (nach Implementierung)

- `pnpm install` — Abhängigkeiten installieren.
- `pnpm build` — Next.js-Build.
- `pnpm test` — Vitest ausführen.
- `pnpm test:e2e` — Playwright ausführen.
- `pnpm lint` — ESLint ausführen.
- `axm validate` — Framework-Validierung.
- `axm pipeline run` — Vollständige Pipeline.
- `axm context slice --for <file>` — Kontext für eine Datei holen.

## Teststrategie

- **Unit-Tests:** Vitest mit JSON-Reporter; Vertragstests werden aus `<Name>.spec.json` generiert.
- **E2E-Tests:** Playwright mit JSON-Reporter + axe-core für Accessibility.
- **Determinismus-Tests:** `axm init` und `axm add component` müssen bei identischem Input byte-identische Ausgaben erzeugen.
- **Invarianten-Tests:** Jede Invariante hat eine Verstoß-Fixture, die Exit 10/60 und den korrekten Fehlercode liefert.

## Sicherheits- und Betriebsaspekte

- Keine dynamischen Imports mit variablen Pfaden (I-12), um nichtdeterministische Code-Pfade zu verhindern.
- Keine `any`-Typen, `@ts-ignore` oder `eslint-disable` (I-09).
- Ownership-Zonen schützen Framework- und generierte Dateien vor versehentlichen Agenten-Änderungen.
- `agent-context.json` speichert SHA-256-Hashes für MACHINE- und LOCKED-Dateien.
- CLI läuft stateless; Retry-Zustand liegt in FIX_PACKETs, nicht im Agenten-Gedächtnis.

## Hinweise für Agenten

- Lies zuerst `agent-context.json`, nicht das Repo.
- Nutze ausschließlich `axm`-Befehle für Mutationen in MACHINE-Zonen.
- Schreibe zuerst das Sidecar `<Name>.spec.json`, dann die Implementierung.
- Ein FIX_PACKET adressiert genau eine Fehlerklasse — korrigiere nur die angegebene Zieldatei.
- Überschreite Budgets nicht; verwende `axm split`, wenn Dateien zu groß werden.
- Halte dich strikt an die Invarianten-Tabelle; Verstöße kompilieren nicht.

## Bekannte M0-Ausnahmen von Invarianten

- **I-04 (Keine Default-Exports):** Die generierten Konfigurationsdateien `vite.config.ts`, `vitest.config.ts` und `eslint.config.js` verwenden zwingend `export default`, weil Vite, Vitest und ESLint 9 diese Form vorschreiben. Diese Dateien liegen in der generierten App und sind nicht AGENT-eigener Komponenten-Code; die Ausnahme wird in M2 im Custom-ESLint-Plugin explizit erlaubt.
- **I-04 (Keine Default-Exports) — Framework-Code:** Der Entry-Point `packages/eslint-plugin-axiom/src/index.ts` verwendet `export default plugin`, weil ESLint 9 Plugins ausschließlich als Default-Export konsumiert. Diese Ausnahme gilt nur für den Plugin-Entry-Point.
- **I-04-Konformität in `src/core/error-boundary.tsx`:** Die generierte LOCKED-Datei `src/core/error-boundary.tsx` exportiert eine benannte Function Component `ErrorBoundary`, die intern `react-error-boundary` verwendet. Damit ist sie vollständig I-04-konform; React-Klassenkomponenten werden nicht verwendet.

## Bekannte M1-Ausnahmen

- **Zod 4 + `zod-to-json-schema`:** Die installierte Runtime ist `zod@4.4.3`. `zod-to-json-schema@3.25.2` deklariert seine Typen gegen die Zod-v3-API (`zod/v3`), obwohl der Peer-Dependency-Bereich `^4` erlaubt. Damit `pnpm build` ohne Type-Assertionen grün bleibt, importieren die Schema-Dateien unter `src/cli/schemas/*.ts` `z` aus `zod/v3`. Zur Laufzeit wird weiterhin dieselbe `zod@4`-Installation verwendet.

## Offener Stand

- `AXIOM_SPEC_v2.0.md` (ersetzt v1.0) und `ATELIER_SPEC_v3.0.md` sind die aktuellen Spezifikationen.
- AXIOM M0–M12 sind implementiert und grün; ATELIER A0–A7 sind per Acceptance-Report abgenommen.
- A8/S-20 Track-A (CURATED) ist end-to-end grün inkl. Deploy und CRITIC-Report.
- `axm plan` liest `BRIEF.axm.json` und erzeugt track-aware Arbeitsaufträge: Track-A (curated) wählt ein Preset aus dem Katalog und spawnt Direction → Tokens → Motion → Pattern → Build → E2E → PERF → CRITIC; Track-B (bespoke) spawnt Brief-Review → Direction-Generate → Operator-Veto → Style-Tile → Tokens → Motion → Custom Components → Build → E2E → PERF → CRITIC.
- `atl direct generate` liest `BRIEF.track`: bei `curated` wird das passende Preset direkt als `DIRECTION.axm.json` eingefroren; bei `bespoke` werden drei Brief-bezogene Richtungskandidaten generiert.
- Neben `axm` existiert die ATELIER-CLI **`atl`** (gleicher CLI-Vertrag; u.a. `atl brief`, `atl direct`, `atl pattern`, `atl critic run`, `atl deploy`) sowie der MCP-Server `atelier-mcp`.
- Nächstes Arbeitspaket: **A8 Track-B** (BESPOKE-Portfolio-Referenzprojekt, siehe `docs/superpowers/plans/2026-07-12-atelier-a8-plan.md`); Fixtures und Tests dafür liegen bereits im Repo (`src/cli/fixtures/track-b-portfolio/`, `src/cli/commands/track-b-fixture.test.ts`).
- Alle Änderungen an LOCKED-/MACHINE-Zonen müssen über `axm`-/`atl`-Befehle oder explizite Framework-Updates erfolgen.
