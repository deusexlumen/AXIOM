# AGENTS.md — AXIOM

> Diese Datei richtet sich an autonome Coding-Agenten. Sie fasst den aktuellen Projektstand, den geplanten Stack, die Repository-Struktur und die Arbeitsregeln zusammen, die aus der vorliegenden Projektspezifikation ablesbar sind.

## Projekt-Übersicht

AXIOM ist ein spezifiziertes, aber noch **nicht implementiertes** Framework für eine deterministische, agenten-native Web-Infrastruktur. Ziel ist eine Web-SPA, die als vorhersagbare Zielumgebung für KI-Agenten dient.

Der einzige Inhalt des Repositories ist momentan:

- `AXIOM_SPEC_v1.0.md` — vollständige Implementierungsspezifikation v1.0 (Status: BUILD-READY)

Es existieren noch keine Konfigurationsdateien wie `package.json`, `tsconfig.json`, `vite.config.ts`, ESLint-Config, Tests oder Quellcode. Jede Implementierungsarbeit beginnt daher mit dem Scaffolding gemäß Spezifikation.

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
| Build Tool | Vite 6 |
| UI Library | React 19 (ausschließlich Function Components) |
| Styling | Tailwind v4, Theme aus `tokens.json` generiert |
| State Management | Zustand 5 |
| Schema/Validation | Zod 4 |
| AST-Codemods | ts-morph |
| Unit Tests | Vitest 3 (`--reporter=json`) |
| E2E Tests | Playwright (`--reporter=json`) + axe-core |
| Linting | ESLint 9 Flat Config + Custom-Plugin `eslint-plugin-axiom` |
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
- `pnpm build` — Vite-Build.
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

## Offener Stand

- Die Spezifikation ist vollständig, aber **nicht implementiert**.
- Keine `package.json`, `tsconfig.json`, Build-Configs oder Quellcode vorhanden.
- Erster Arbeitsschritt bei Implementierung: Meilenstein M0 (`axm init` funktionsfähig machen).
