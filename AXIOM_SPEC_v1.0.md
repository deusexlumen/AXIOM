# AXIOM — Agent-Native Framework Architecture
## Vollständige Implementierungs-Spezifikation v1.0

**Status:** BUILD-READY
**Zielgruppe:** Autonome Coding-Agenten (Claude Code, Cursor) + Operator (Mensch als Veto-Instanz)
**Doktrin:** Determinismus > Eleganz. Maschinenlesbarkeit > menschliche Ergonomie. Ein Weg, keine Optionen.

---

## 0. BLUF — Was gebaut wird

AXIOM ist eine Web-Infrastruktur, die als **deterministische Zielumgebung für KI-Agenten** dient. Kernstück sind vier Subsysteme:

1. **Manifest-Kern** — `agent-context.json` als Single Source of Truth (SSOT). Kein Agent liest Code, um den Projektzustand zu verstehen; er liest das Manifest.
2. **CLI `axm`** — die einzige M2M-Schnittstelle. Jeder Befehl: JSON rein, NDJSON raus, semantische Exit-Codes.
3. **Invarianten-Enforcement** — Hard Caps (120 LOC/Datei, 4 KB, ein Export pro Datei) via Custom-ESLint-Plugin + Schema-Validierung. Verstöße kompilieren nicht.
4. **Self-Healing-Pipeline** — State Machine `GENERATE → VALIDATE → TYPECHECK → LINT → TEST → E2E`. Jeder Fehlschlag emittiert ein `FIX_PACKET` (normalisierter Stacktrace + minimaler Kontext-Slice), das der Agent ohne weiteres Repo-Lesen konsumieren kann. Max. 3 Retries, dann Eskalation an den Operator.

---

## 1. STACK-LOCK (Entscheidungsdiktatur)

**Leitprinzip der Auswahl:** Anti-Halluzination. Der Stack mit der höchsten Trainingsdaten-Abdeckung in aktuellen LLMs gewinnt. Exotische Eleganz erzeugt Halluzinationen; Mainstream erzeugt Determinismus. Das ist die zentrale These des gesamten Frameworks — sie diktiert jede Stack-Entscheidung.

| Layer | Entscheidung | Begründung (eine Zeile) |
|---|---|---|
| **Runtime** | Node.js 22 LTS | Maximale LLM-Korpus-Abdeckung; Bun/Deno verworfen (API-Drift → Halluzinationsrisiko) |
| **Package Manager** | pnpm 9 | Deterministischer Lockfile, striktes `node_modules` (keine Phantom-Dependencies für Agenten) |
| **Build** | Vite 6 | De-facto-Standard; Agenten kennen die Config auswendig |
| **UI** | React 19, ausschließlich Function Components | Größter Trainingskorpus aller UI-Libs; Klassen-Komponenten sind per Lint verboten |
| **Styling** | Tailwind v4, Theme generiert aus `tokens.json` | Agenten halluzinieren bei Raw-CSS; Tailwind-Klassen sind atomar validierbar. Arbitrary Values (`w-[137px]`) per Lint verboten |
| **State** | Zustand 5 | Minimaler Boilerplate = minimale Fehlerfläche |
| **Schema/Validation** | Zod 4 | Runtime-Validierung + Typinferenz + JSON-Schema-Export aus einer Quelle |
| **AST-Codemods** | ts-morph | Deterministische Code-Injektion statt Freitext-Edits im Kern |
| **Unit-Tests** | Vitest 3 (`--reporter=json`) | Maschinenlesbare Reports nativ |
| **E2E** | Playwright (`--reporter=json`) + axe-core | DOM-Snapshots + a11y als Pipeline-Gate |
| **Lint** | ESLint 9 Flat Config + `eslint-plugin-axiom` (custom) | Invarianten-Enforcement, siehe §5 |
| **TypeScript** | 5.x, `strict: true`, `noUncheckedIndexedAccess: true` | Typfehler = frühestes maschinenlesbares Fehlersignal |

**Verworfene Alternativen (keine Diskussion):** Bun (API-Instabilität), SolidJS/Svelte (Korpus zu dünn), CSS-in-JS (Laufzeit-Nichtdeterminismus), Monorepo-Tooling wie Nx/Turbo (Token-Overhead im Kontext ohne Nutzen für Single-App-Scope v1).

---

## 2. INVARIANTEN (nicht verhandelbar, maschinell erzwungen)

Jede Invariante hat eine ID. Lint-Fehler referenzieren diese IDs. FIX_PACKETs referenzieren diese IDs. Das ist das gemeinsame Vokabular zwischen Framework und Agent.

| ID | Invariante | Enforcement |
|---|---|---|
| **I-01** | Max. **120 LOC** pro Datei (ohne Leerzeilen/Kommentare) | `eslint-plugin-axiom/max-loc` |
| **I-02** | Max. **4096 Bytes** pro Quelldatei | `axm validate` (Pre-Commit + Pipeline) |
| **I-03** | **Genau ein** benannter Export pro Komponenten-Datei | `axiom/single-export` |
| **I-04** | Keine Default-Exports (außer generierte Route-Wrapper) | `axiom/no-default-export` |
| **I-05** | Keine Barrel-Files (`index.ts` mit Re-Exports); Auflösung nur über Manifest | `axiom/no-barrel` |
| **I-06** | Imports ausschließlich absolut via Alias `@/` | `axiom/absolute-imports` |
| **I-07** | Jede Komponente besitzt eine Sidecar-Datei `<Name>.spec.json` (Props-Schema, States, a11y) | `axm validate` |
| **I-08** | Keine Raw-Farbwerte, keine Raw-Pixel: nur Token-Referenzen | `axiom/tokens-only` |
| **I-09** | Kein `any`, kein `@ts-ignore`, kein `eslint-disable` | ESLint + `axiom/no-escape-hatch` |
| **I-10** | Verzeichnisse haben **Ownership-Zonen** (§3); Schreibzugriff außerhalb der Zone = Pipeline-Abbruch | `axm validate --ownership` |
| **I-11** | Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema (§7) | CLI-Kern |
| **I-12** | Keine dynamischen Imports mit variablen Pfaden (`import(x)`) | `axiom/static-imports` |

**Rationale I-01/I-02:** Eine Datei = ein Kontext-Chunk. 4 KB ≈ ~1.000 Tokens → ein Fix-Kontext von Datei + Sidecar + FIX_PACKET bleibt unter 3.000 Tokens.
**Rationale I-05:** Barrel-Files zwingen Agenten zum transitiven Lesen. Das Manifest ersetzt sie vollständig.

---

## 3. REPOSITORY-LAYOUT & OWNERSHIP-ZONEN

```
axiom-app/
├── axiom.config.json          # LOCKED      — Framework-Konfiguration
├── agent-context.json          # MACHINE     — SSOT, nur via CLI mutierbar
├── tokens.json                 # OPERATOR    — Design-Tokens, Mensch/Agent via CLI
├── .cursorrules                # MACHINE     — generiert aus agent-context.json
├── CLAUDE.md                   # MACHINE     — generiert, Agenten-Onboarding
├── src/
│   ├── core/                   # LOCKED      — Framework-Runtime, Agent liest, schreibt NIE
│   │   ├── router.ts
│   │   ├── error-boundary.tsx
│   │   └── token-provider.tsx
│   ├── components/             # AGENT       — Schreibzone des Agenten
│   │   ├── Button.tsx
│   │   ├── Button.spec.json    # Sidecar (Pflicht, I-07)
│   │   └── Button.test.tsx     # generiert aus Sidecar, Agent darf erweitern
│   ├── routes/                 # MACHINE     — nur via `axm add route`
│   ├── state/                  # AGENT       — Zustand-Stores, gleiche Invarianten
│   └── generated/              # MACHINE     — Tailwind-Theme, Route-Manifest, NIE editieren
├── pipeline/
│   ├── fix-packets/            # MACHINE     — FIX_PACKET-Archiv (NDJSON, append-only)
│   └── reports/                # MACHINE     — Test-/Lint-Reports (JSON)
└── e2e/                        # AGENT       — Playwright-Specs
```

**Ownership-Zonen (I-10):**
- **LOCKED:** Nur Framework-Updates ändern diese Dateien. Agent-Schreibversuch → `AXM-V010`, Pipeline-Abbruch.
- **MACHINE:** Nur die CLI mutiert. Direkter Edit → Hash-Mismatch bei `axm validate` → `AXM-V011`.
- **AGENT:** Freie Schreibzone unter Invarianten-Enforcement.
- **OPERATOR:** Mensch editiert, Agent nur via expliziten CLI-Befehl.

Zonen-Enforcement: `agent-context.json` hält SHA-256-Hashes aller MACHINE/LOCKED-Dateien. `axm validate` vergleicht.

---

## 4. MANIFESTE & SCHEMAS (SSOT-Schicht)

### 4.1 `agent-context.json` — das Zentralnervensystem

Der Agent liest **diese eine Datei** statt das Repo zu explorieren. Sie beantwortet: Was existiert? Wo? Mit welchem Interface? In welchem Zustand?

```json
{
  "$schema": "./node_modules/@axiom/core/schemas/agent-context.schema.json",
  "axiomVersion": "1.0.0",
  "project": {
    "name": "demo-app",
    "tokenBudget": { "hardLimitPerSlice": 8000, "warnAt": 6000 }
  },
  "components": [
    {
      "name": "Button",
      "file": "src/components/Button.tsx",
      "spec": "src/components/Button.spec.json",
      "test": "src/components/Button.test.tsx",
      "exports": ["Button"],
      "dependsOn": [],
      "usedBy": ["src/routes/home.route.tsx"],
      "loc": 42,
      "bytes": 1187,
      "status": "GREEN",
      "specHash": "sha256:9f2c…",
      "lastPipelineRun": "2026-07-08T14:22:01Z"
    }
  ],
  "routes": [
    { "path": "/", "component": "Home", "file": "src/routes/home.route.tsx" }
  ],
  "stores": [],
  "tokens": { "file": "tokens.json", "hash": "sha256:aa41…" },
  "integrity": {
    "lockedFiles": { "src/core/router.ts": "sha256:bb32…" },
    "machineFiles": { "src/generated/theme.css": "sha256:cc11…" }
  },
  "pipeline": {
    "lastRun": { "id": "run_0042", "result": "GREEN", "failedStage": null }
  }
}
```

**Status-Enum pro Komponente:** `GREEN` (alle Gates bestanden) | `RED` (Pipeline-Fehlschlag, FIX_PACKET existiert) | `STALE` (Datei geändert, Pipeline ausstehend) | `ORPHAN` (im Manifest, Datei fehlt → `AXM-V020`).

**Mutationsregel:** Diese Datei wird ausschließlich von `axm`-Befehlen geschrieben. Der Agent behandelt sie als read-only Datenbank.

### 4.2 Komponenten-Sidecar `<Name>.spec.json`

Der Vertrag der Komponente. Aus ihm werden generiert: (a) Props-Interface via Zod, (b) Basis-Testsuite, (c) a11y-Assertions.

```json
{
  "$schema": "./node_modules/@axiom/core/schemas/component-spec.schema.json",
  "name": "Button",
  "description": "Primärer Aktions-Button. Eine Zeile. Keine Prosa.",
  "props": {
    "label":    { "type": "string",  "required": true,  "constraints": { "minLength": 1, "maxLength": 40 } },
    "variant":  { "type": "enum",    "values": ["primary", "secondary", "danger"], "default": "primary" },
    "disabled": { "type": "boolean", "default": false },
    "onPress":  { "type": "function", "signature": "() => void", "required": true }
  },
  "states": ["default", "hover", "focus", "disabled", "loading"],
  "a11y": {
    "role": "button",
    "focusable": true,
    "minTouchTarget": "44x44",
    "requiredAria": ["aria-disabled bei disabled=true"]
  },
  "tokensUsed": ["color.action.primary", "radius.md", "space.2", "space.4"],
  "forbidden": ["direkter DOM-Zugriff", "eigener useEffect für Styling", "Inline-Styles"]
}
```

**Regel für Agenten:** Erst Sidecar schreiben (oder via `axm add component` generieren lassen), dann Implementierung. Implementierung, die vom Sidecar abweicht → `AXM-V030` bei `axm validate`.

### 4.3 `tokens.json`

Flaches, referenzierbares Token-Set. Daraus generiert `axm tokens build`: (a) `src/generated/theme.css` (CSS Custom Properties), (b) Tailwind-v4-Theme, (c) TypeScript-Typ `TokenRef` (Union aller gültigen Pfade → Compile-Fehler bei Tippfehlern).

```json
{
  "color": {
    "action":  { "primary": "#4F46E5", "danger": "#DC2626" },
    "surface": { "base": "#0B0F19", "raised": "#151B2B" },
    "text":    { "primary": "#F5F7FA", "muted": "#8A93A6" }
  },
  "space":  { "1": "4px", "2": "8px", "4": "16px", "8": "32px" },
  "radius": { "sm": "4px", "md": "8px", "full": "9999px" },
  "font":   { "size": { "sm": "14px", "base": "16px", "xl": "24px" } }
}
```

### 4.4 `axiom.config.json`

```json
{
  "budgets": { "maxLocPerFile": 120, "maxBytesPerFile": 4096, "maxRetries": 3 },
  "pipeline": { "stages": ["validate", "typecheck", "lint", "unit", "e2e"], "e2eOn": "route-change" },
  "context":  { "sliceDepth": 2, "signatureOnlyBeyondDepth": 1 }
}
```

---

## 5. CLI-VERTRAG — `axm`

**Universalregeln:**
- Jeder Befehl akzeptiert `--json` implizit (es gibt keinen Nicht-JSON-Modus). Output = NDJSON, eine Statuszeile pro Ereignis, letzte Zeile = Result-Objekt.
- Keine interaktiven Prompts. Fehlende Pflichtparameter → sofortiger Exit 10 mit FIX_PACKET.
- Idempotenz: Zweifacher identischer Aufruf = identisches Ergebnis, kein Fehler.

**Exit-Codes (semantisch, global):**

| Code | Bedeutung | Agent-Aktion |
|---|---|---|
| 0 | OK | Weiter |
| 10 | Validierungsfehler (Schema/Invariante) | FIX_PACKET lesen, Datei korrigieren |
| 20 | TypeScript-Fehler | FIX_PACKET lesen, Typen korrigieren |
| 30 | Testfehler (Unit/E2E) | FIX_PACKET lesen, Logik korrigieren |
| 40 | Budget überschritten (LOC/Bytes/Tokens) | Datei splitten via `axm split` |
| 50 | Interner Framework-Fehler | Eskalation an Operator, NICHT retrien |
| 60 | Ownership-Verletzung | Schreibziel korrigieren |

### 5.1 Befehlsreferenz

**`axm init <name>`**
Scaffoldet das komplette Repo-Layout (§3), installiert Stack (§1), schreibt initiales Manifest, generiert `CLAUDE.md` + `.cursorrules`.
Output-Result: `{ "ok": true, "created": [<paths>], "next": "axm add component <Name>" }`

**`axm add component <Name> [--spec <path|inline-json>]`**
Ohne `--spec`: generiert Sidecar-Skelett + Komponenten-Stub + Test-Stub aus Templates (§8), registriert im Manifest mit Status `STALE`.
Mit `--spec`: validiert Spec gegen Schema, generiert Stub passend zu den Props.
Result: `{ "ok": true, "files": { "component": "...", "spec": "...", "test": "..." }, "status": "STALE" }`

**`axm add route <path> --component <Name>`**
Generiert Route-Wrapper in `src/routes/` (MACHINE-Zone), verdrahtet Router via ts-morph-Codemod, aktualisiert Manifest. Komponente muss existieren, sonst Exit 10 / `AXM-V040`.

**`axm add store <name> --shape <inline-json>`**
Generiert Zustand-Store mit Zod-validiertem Shape.

**`axm validate [--scope <file|component>]`**
Prüft: Manifest-Integrität, Sidecar-Konformität (I-07, `AXM-V030`), Invarianten I-01…I-12, Ownership-Hashes, Token-Referenzen.
Result: `{ "ok": false, "violations": [<FIX_PACKET>, …] }`

**`axm pipeline run [--scope <component>] [--stage <stage>]`**
Führt die State Machine (§6) aus. Bei `--scope` nur den betroffenen Teilgraphen (Komponente + `usedBy`-Kette). Schreibt Reports nach `pipeline/reports/`, FIX_PACKETs nach `pipeline/fix-packets/`.
Result: `{ "runId": "run_0043", "result": "RED", "failedStage": "unit", "fixPacket": "pipeline/fix-packets/run_0043.json" }`

**`axm context slice --for <file> [--budget <tokens>] [--signatures]`**
Der Token-Ökonomie-Kern. Liefert den minimalen Kontext, den ein Agent braucht, um `<file>` zu bearbeiten:
1. Zieldatei (voll) + Sidecar (voll)
2. Direkte Dependencies (Tiefe 1): voll
3. Tiefe 2: nur exportierte Signaturen (ts-morph-Extraktion, `--signatures` erzwingt das ab Tiefe 1)
4. Relevanter Token-Ausschnitt aus `tokens.json` (nur `tokensUsed` der Sidecar)
5. Letztes FIX_PACKET der Datei, falls Status RED

Result: `{ "tokens": 2741, "budget": 8000, "slices": [{ "path": "...", "mode": "full|signatures", "content": "..." }] }`
Budget-Überschreitung → Exit 40 + Splitting-Vorschlag.

**`axm split <file> --at <exportName|line>`**
Deterministischer ts-morph-Codemod: extrahiert Teilfunktion/Subkomponente in neue Datei, schreibt Imports um, aktualisiert Manifest. Die vorgeschriebene Antwort auf `AXM-B001` (Budget-Verletzung).

**`axm tokens build`**
Regeneriert `theme.css`, Tailwind-Theme, `TokenRef`-Typ aus `tokens.json`. Pflicht nach jeder Token-Änderung (Hash-Check erzwingt es).

**`axm graph [--for <component>]`**
Dependency-Graph als JSON (Adjazenzliste). Grundlage für Scope-Berechnung und Slicing.

**`axm heal --auto [--max-retries 3]`**
Der Selbstheilungs-Loop als ein Befehl (für Agenten-Betrieb via Hook): führt Pipeline aus, gibt bei RED das FIX_PACKET auf stdout aus, wartet auf korrigierte Datei (Watcher), re-runt. Nach `maxRetries` Fehlschlägen: Exit 50 + `ESCALATION_REPORT` (§7.3).

**`axm status`**
Ein-Blick-Zustand: `{ "components": { "green": 12, "red": 1, "stale": 2 }, "redList": ["Button"], "lastRun": "run_0043" }`

---

## 6. SELF-HEALING-PIPELINE — State Machine

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

**Regeln:**
- **Fail-fast, eine Stage:** Pipeline stoppt an der ersten roten Stage. Ein FIX_PACKET adressiert genau eine Fehlerklasse — kein Fehler-Sammelsurium, das den Agenten-Kontext flutet.
- **Scope-Isolation:** `axm pipeline run --scope Button` testet nur Button + `usedBy`-Kette. Voll-Runs nur bei Route-/Token-Änderungen.
- **Attempt-Zählung** liegt im FIX_PACKET (`attempt: 2/3`), nicht im Agenten-Gedächtnis — der Agent ist stateless, das Framework hält den Zustand.
- **Retry-Hygiene:** Jedes Retry-FIX_PACKET enthält den Diff des letzten Korrekturversuchs (`lastAttemptDiff`), damit der Agent nicht dieselbe fehlerhafte Korrektur wiederholt.
- **E2E-Gate:** Läuft nur bei Route-Änderungen oder `--stage e2e` (Kostendisziplin). axe-core-Verstöße = RED, keine Warnings.

---

## 7. FEHLERPROTOKOLL

### 7.1 Fehlercode-Taxonomie

| Prefix | Klasse | Beispiele |
|---|---|---|
| `AXM-Vxxx` | Validierung/Invarianten | V001 LOC-Cap, V002 Byte-Cap, V003 Mehrfach-Export, V008 Raw-Token, V010 LOCKED-Schreibversuch, V011 MACHINE-Hash-Mismatch, V020 Orphan, V030 Spec-Drift, V040 fehlende Dependency |
| `AXM-Txxx` | TypeScript | T001 Typfehler (trägt TS-Code, z. B. TS2322, mit) |
| `AXM-Lxxx` | Lint | L001 Regel-Verstoß (trägt ESLint-Rule-ID mit) |
| `AXM-Uxxx` | Unit-Test | U001 Assertion, U002 Timeout, U003 Unhandled Rejection |
| `AXM-Exxx` | E2E/a11y | E001 Selector nicht gefunden, E010 axe-Violation |
| `AXM-Bxxx` | Budget | B001 Datei-Budget, B002 Slice-Token-Budget |
| `AXM-Ixxx` | Intern | I001 Framework-Bug → immer Eskalation, nie Retry |

### 7.2 FIX_PACKET-Schema (das Kernartefakt)

```json
{
  "$schema": "./node_modules/@axiom/core/schemas/fix-packet.schema.json",
  "packetId": "run_0043_p1",
  "runId": "run_0043",
  "attempt": { "current": 2, "max": 3 },
  "errorCode": "AXM-U001",
  "stage": "unit",
  "severity": "BLOCKING",
  "target": {
    "component": "Button",
    "file": "src/components/Button.tsx",
    "line": 34,
    "column": 12
  },
  "message": "Expected aria-disabled='true' when disabled prop is set",
  "rawEvidence": {
    "stacktrace": "AssertionError: expected 'false' to equal 'true'\n  at Button.test.tsx:21:5",
    "testName": "Button > disabled state > sets aria-disabled",
    "excerpt": { "startLine": 29, "endLine": 39, "code": "…±5 Zeilen um die Fehlerstelle…" }
  },
  "probableCause": "disabled-Prop wird an className, aber nicht an aria-disabled durchgereicht (Sidecar a11y.requiredAria verletzt)",
  "fixHint": "aria-disabled={disabled} am button-Element setzen. Sidecar-Vertrag: Button.spec.json → a11y.requiredAria",
  "lastAttemptDiff": "--- a/src/components/Button.tsx\n+++ …(Diff des gescheiterten Versuchs 1)",
  "contextSlice": {
    "command": "axm context slice --for src/components/Button.tsx",
    "estimatedTokens": 2741
  },
  "invariantsAffected": ["I-07"],
  "agentInstruction": "Korrigiere NUR target.file. Ändere NICHT den Test. Ändere NICHT das Sidecar. Danach: axm pipeline run --scope Button"
}
```

**Designprinzipien des Packets:**
- `probableCause` + `fixHint` sind heuristisch generiert (Regelwerk pro Fehlercode) — sie lenken, ohne zu binden.
- `agentInstruction` ist imperativ und schließt die typischen Agenten-Fluchtwege aus (Test „passend machen", Sidecar aufweichen).
- Gesamtgröße Packet + Slice < 4.000 Tokens (garantiert durch Excerpt-Limits).

### 7.3 ESCALATION_REPORT (nach maxRetries)

```json
{
  "escalationId": "esc_0007",
  "component": "Button",
  "attempts": 3,
  "packets": ["run_0041_p1", "run_0042_p1", "run_0043_p1"],
  "diffHistory": ["…"],
  "hypothesis": "Widerspruch zwischen Sidecar (a11y.requiredAria) und Test-Fixture — Spec-Ebene, nicht Code-Ebene",
  "operatorActionRequired": "Sidecar-Entscheidung treffen: requiredAria anpassen ODER Test-Fixture korrigieren",
  "scopeLocked": true
}
```

---

## 8. CODEGEN-TEMPLATES (deterministisch, ts-morph-gestützt)

### 8.1 Komponenten-Stub (aus `axm add component Button --spec …`)

```tsx
// src/components/Button.tsx — AXIOM AGENT ZONE
// Vertrag: ./Button.spec.json | Invarianten: I-01..I-12
import { z } from "zod";
import type { TokenRef } from "@/generated/token-types";

export const ButtonProps = z.object({
  label: z.string().min(1).max(40),
  variant: z.enum(["primary", "secondary", "danger"]).default("primary"),
  disabled: z.boolean().default(false),
  onPress: z.function().args().returns(z.void()),
});
type Props = z.infer<typeof ButtonProps>;

export function Button({ label, variant = "primary", disabled = false, onPress }: Props) {
  return (
    <button
      type="button"
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onPress}
      className={/* AGENT: Tailwind-Klassen, nur Token-basiert (I-08) */ ""}
    >
      {label}
    </button>
  );
}
```

### 8.2 Test-Stub (generiert aus Sidecar — Assertions kommen aus dem Vertrag)

```tsx
// src/components/Button.test.tsx — generiert aus Button.spec.json
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/Button";

describe("Button [contract]", () => {
  it("renders label", () => {
    render(<Button label="Go" onPress={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();
  });
  it("disabled state sets aria-disabled", () => {
    render(<Button label="Go" disabled onPress={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-disabled", "true");
  });
  it("fires onPress exactly once per click", () => {
    const fn = vi.fn();
    render(<Button label="Go" onPress={fn} />);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

**Regel:** Vertragstests (Block `[contract]`) sind MACHINE-owned — der Agent darf eigene `describe`-Blöcke ergänzen, den Contract-Block nie ändern (`AXM-V011` bei Hash-Mismatch des Blocks).

### 8.3 Generierte Agenten-Dokumente

`axm init` erzeugt und `axm`-Mutationen aktualisieren:
- **`CLAUDE.md` / `.cursorrules`:** ~60 Zeilen. Inhalt: Invarianten-Tabelle, CLI-Spickzettel, die drei Kardinalregeln („Lies das Manifest, nicht das Repo" / „Ein FIX_PACKET, eine Korrektur, ein Re-Run" / „Splitte statt zu quetschen"), Zonen-Karte.

---

## 9. TOKEN-ÖKONOMIE — Slice-Algorithmus (normativ)

```
INPUT: targetFile, budget (default 8000)
1. slice ← [targetFile:FULL, sidecar(targetFile):FULL]
2. G ← Import-Graph aus agent-context.json (kein Datei-Parsing!)
3. FOR dep IN neighbors(G, targetFile, depth=1): slice += dep:FULL
4. FOR dep IN neighbors(G, targetFile, depth=2): slice += dep:SIGNATURES
   (SIGNATURES = ts-morph: exportierte Deklarationen + JSDoc, keine Bodies)
5. slice += tokens.json ∩ sidecar.tokensUsed
6. IF status(targetFile) == RED: slice += letztes FIX_PACKET
7. count ← tokenEstimate(slice)          # tiktoken cl100k, konservativ ×1.1
8. IF count > budget:
     a. degradiere depth-1 auf SIGNATURES
     b. IF immer noch > budget: Exit 40, AXM-B002 + Split-Vorschlag
OUTPUT: NDJSON-Slices, sortiert: FIX_PACKET → target → sidecar → deps
```

**Sortier-Rationale:** Fehlerkontext zuerst — LLMs gewichten Kontextanfang und -ende am stärksten.

---

## 10. BAUPLAN — Meilensteine mit Abnahmekriterien

Reihenfolge ist fix. Kein Meilenstein beginnt, bevor der vorige GREEN ist.

| MS | Deliverable | Umfang | Abnahmekriterium (hart) |
|---|---|---|---|
| **M0** | Repo-Skeleton + Stack | `axm init` funktionsfähig, Layout §3, Stack §1 installiert | `pnpm build` grün auf frischem Scaffold |
| **M1** | Manifest-Kern | Alle 4 Schemas (Zod→JSON-Schema), `agent-context.json`-Reader/Writer, Hash-Integrität | Property-Test: 1.000 zufällige Mutationen via API → Manifest stets schema-valide |
| **M2** | Invarianten-Enforcement | `eslint-plugin-axiom` (alle I-Regeln), `axm validate` inkl. Ownership | Jede der 12 Invarianten hat einen Verstoß-Fixture-Test, der Exit 10/60 + korrekten Fehlercode liefert |
| **M3** | Codegen | `axm add component/route/store`, Templates §8, ts-morph-Codemods | Golden-File-Tests: identischer Input → byte-identischer Output (Determinismus-Beweis) |
| **M4** | Pipeline + FIX_PACKET | State Machine §6, Fehler-Normalisierung (TS/ESLint/Vitest/Playwright → FIX_PACKET), `axm heal` | 10 präparierte Fehler-Fixtures → 10 schema-valide FIX_PACKETs mit korrektem errorCode |
| **M5** | Context-Slicer | `axm context slice`, `axm split`, Token-Zählung | Slice eines 30-Komponenten-Demo-Repos bleibt < 8.000 Tokens; `axm split` erzeugt kompilierende Ergebnisse |
| **M6** | E2E + a11y-Gate + Agenten-Docs | Playwright-Integration, axe-Gate, `CLAUDE.md`-Generator | End-to-End-Abnahmeszenario S-06 (unten) grün |

### Abnahmeszenarien (Gherkin, verbindlich)

```gherkin
Szenario S-01: Deterministisches Scaffolding
  Angenommen ein leeres Verzeichnis
  Wenn der Agent "axm init demo && axm add component Card" ausführt
  Dann existieren Card.tsx, Card.spec.json, Card.test.tsx
  Und agent-context.json listet Card mit Status "STALE"
  Und ein zweiter identischer Lauf in frischem Verzeichnis erzeugt byte-identische Dateien

Szenario S-02: Invarianten-Härte
  Angenommen eine Komponente mit 140 LOC
  Wenn "axm validate" läuft
  Dann ist der Exit-Code 10
  Und das FIX_PACKET enthält errorCode "AXM-V001" und fixHint mit "axm split"

Szenario S-03: Selbstheilung in einem Zyklus
  Angenommen Button.tsx verletzt den Sidecar-a11y-Vertrag
  Wenn "axm heal --auto" läuft und der Agent das FIX_PACKET konsumiert
  Dann enthält das Packet Zeile, Excerpt, probableCause und agentInstruction
  Und nach einer Korrektur, die nur target.file ändert, endet die Pipeline GREEN

Szenario S-04: Retry-Hygiene
  Angenommen der erste Korrekturversuch schlägt erneut fehl
  Wenn das zweite FIX_PACKET erzeugt wird
  Dann enthält es lastAttemptDiff des ersten Versuchs
  Und attempt.current == 2

Szenario S-05: Eskalation statt Endlosschleife
  Angenommen drei fehlgeschlagene Korrekturversuche
  Wenn die Pipeline erneut RED endet
  Dann wird ein ESCALATION_REPORT geschrieben
  Und der Scope ist gesperrt (weitere heal-Aufrufe: Exit 50)

Szenario S-06: Prompt-to-Code (Abnahme M6)
  Angenommen ein frisches "axm init"-Projekt
  Wenn ein Agent ausschließlich über axm-Befehle und AGENT-Zonen-Schreibzugriffe
       eine Route "/" mit Header, Card-Grid (3 Cards) und Button baut
  Dann ist "axm pipeline run" inkl. E2E und axe GREEN
  Und kein Schreibzugriff erfolgte in LOCKED- oder MACHINE-Zonen
  Und "axm context slice --for <jede Datei>" bleibt unter 8.000 Tokens
```

---

## 11. EXPLIZITE NICHT-ZIELE (v1)

- **Kein SSR/Backend** — v1 ist Client-only (Vite SPA). API-Layer = v2.
- **Kein Multi-Agent-Locking** — ein Agent pro Repo-Instanz. Parallelität = v2 (Manifest hätte dafür bereits Hash-Basis).
- **Keine visuelle Regression (Pixel-Diffs)** — DOM-Snapshots + axe reichen für v1; Screenshot-Diffing ist flaky und flutet FIX_PACKETs.
- **Kein Plugin-System** — Erweiterbarkeit ist der Feind des Determinismus in v1.

---

## 12. KONFIDENZ- UND LÜCKENREPORT

**Konfidenz: 87 %**

| Bereich | Konfidenz | Kommentar |
|---|---|---|
| Manifest/Schemas/Invarianten | 95 % | Etablierte Technik, geringe Unbekannte |
| CLI-Vertrag + Exit-Codes | 92 % | Rein handwerklich |
| FIX_PACKET-Normalisierung | 80 % | Playwright-Fehler-Normalisierung ist die fummeligste Adapter-Arbeit |
| Token-Schätzung im Slicer | 75 % | tiktoken approximiert Claude-Tokenizer nur; konservativer ×1.1-Faktor mitigiert, verifizieren in M5 |
| heuristische probableCause-Regeln | 70 % | Regelwerk wächst empirisch; v1 startet mit ~20 Regeln für die häufigsten Fehlercodes |

**Lücken (P-Tier):**
- **P1 — Tailwind-v4-Theme-Generierung aus tokens.json:** v4-Theme-API (`@theme`) verifizieren; Fallback ist CSS-Custom-Properties-only (funktional identisch, weniger elegant). Entscheidung in M0.
- **P1 — Contract-Block-Hashing in Testdateien:** Block-genaues Hashing (statt Datei-genau) braucht einen stabilen Marker-Parser; Spezifikation der Marker-Syntax (`// @axiom:contract:start/end`) vor M3 festzurren.
- **P2 — `axm heal --auto` Watcher-Semantik:** Debounce-Fenster und „Korrektur fertig"-Signal definieren (Vorschlag: Agent schreibt `pipeline/ack/<packetId>` als Fertig-Signal statt File-Watching-Heuristik).
- **P2 — E2E-Selektorstrategie:** `data-axm-id` als generiertes Pflicht-Attribut pro Komponente würde E001-Fehler drastisch senken — Kandidat für Invariante I-13.
- **P3 — Multi-Agent v2:** Manifest-Design ist vorbereitet (Hashes), aber Locking-Protokoll ungespect.

**Einzige offene Operator-Entscheidung:** Name/CLI-Kürzel (`axiom`/`axm`) ist Platzhalter — bei Kollision mit deinem Branding einmalig global ersetzen, sonst keine Entscheidungen offen.
