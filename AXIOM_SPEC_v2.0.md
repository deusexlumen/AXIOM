# AXIOM — Agent-Native Framework Architecture
## Vollständige Implementierungs-Spezifikation v2.0 (MAXIMUM BUILD)

**Status:** BUILD-READY
**Ersetzt:** v1.0 vollständig (dieses Dokument ist eigenständig, kein Diff-Lesen nötig)
**Doktrin unverändert:** Determinismus > Eleganz. Maschinenlesbarkeit > menschliche Ergonomie. Ein Weg, keine Optionen.
**Neu in v2:** AXIOM ist nicht mehr nur Ausführungsschicht — es ist **Betriebssystem für Agenten-Schwärme**: Intent-Layer, Work-Order-DAG, Multi-Agent-Leases, Entscheidungs-Gedächtnis, Selbstvermessung.

---

## 0.1 BLUF — Was v2 hinzufügt

| # | Subsystem (neu) | Ein-Satz-Funktion |
|---|---|---|
| 1 | **Intent-Layer** (`VISION.axm.json` + `axm plan`) | Operator-Vision → deterministisch dekomponierter Work-Order-DAG mit Human-Veto-Gate |
| 2 | **Work-Order-Protokoll** | Bauaufträge als maschinenlesbare Pakete — das konstruktive Gegenstück zum FIX_PACKET |
| 3 | **Multi-Agent-Orchestrierung** | Lease-basiertes Scope-Locking im Manifest: N Agenten, ein Working Tree, null Merge-Konflikte |
| 4 | **API- & Datenschicht** | Contract-first (Zod → Hono → generierter Client), Drizzle/Postgres, deterministische Migrationen |
| 5 | **Decision Ledger** | Append-only Maschinen-ADRs — Agenten dürfen entschiedene Fragen nicht re-litigieren |
| 6 | **AXIOM-Bench** | Selbstvermessung: Green-Rate@1, Tokens-to-Green, Eskalationsrate — das Framework beweist seine eigene These |
| 7 | **Security/Supply-Chain** | Exakt-Pinning, Script-Verbot, `axm audit`, Lockfile-Hash im Manifest |
| 8 | **CI/CD + Deploy** | Headless-Heal in GitHub Actions, Vercel als diktiertes Deploy-Ziel |
| 9 | **Visual Gate (opt-in)** | Deterministisches Pixel-Diffing mit gepinnten Fonts/Viewport — pro Komponente zuschaltbar |

## 0.2 DELTA-LOG v1.0 → v2.0

| Bereich | v1.0 | v2.0 |
|---|---|---|
| Scope | Client-only SPA | SPA + API-Layer + Datenschicht |
| Agenten | 1 Agent / Repo | N Agenten via Lease-Protokoll + Conductor-Pattern |
| Auftragserteilung | informell (Prompt) | formal: `VISION.axm.json` → WORK_ORDER-DAG |
| Gedächtnis | keins | DECISION_LEDGER (append-only, enforcement-fähig) |
| Invarianten | I-01…I-12 | + I-13…I-17 |
| Exit-Codes | 0–60 | + 70 (Lease), 80 (Ledger) |
| Fehler-Taxonomie | V/T/L/U/E/B/I | + P (Plan), W (Order), M (Multi-Agent), D (Data), C (Contract), S (Security) |
| Pipeline | 5 Stages | + PLAN (upstream), + VISUAL (opt-in), Parallel-Scopes |
| Meilensteine | M0–M6 | + M7–M12, Szenarien S-07…S-12 |
| **v1-Lücken** | 2×P1, 2×P2 offen | **alle geschlossen** (§15, verbindliche Resolutionen) |

---

## 1. STACK-LOCK v2 (Entscheidungsdiktatur)

Leitprinzip unverändert: **Anti-Halluzination** — maximale Trainingskorpus-Abdeckung schlägt Eleganz.

### 1.1 Frontend (unverändert aus v1)

| Layer | Entscheidung |
|---|---|
| Runtime | Node.js 22 LTS |
| Package Manager | pnpm 9 (`save-exact=true`, `ignore-scripts=true` — §13) |
| Build | Vite 6 |
| UI | React 19, nur Function Components |
| Styling | Tailwind v4, Theme aus `tokens.json` (Resolution §15.1) |
| State | Zustand 5 |
| Schema | Zod 4 |
| AST | ts-morph |
| Unit | Vitest 3 (`--reporter=json`) |
| E2E | Playwright + axe-core |
| Lint | ESLint 9 Flat + `eslint-plugin-axiom` |

### 1.2 Backend & Daten (neu)

| Layer | Entscheidung | Begründung (eine Zeile) |
|---|---|---|
| **API-Runtime** | Hono 4 auf Node | Schlank, streng typisiert, `@hono/zod-openapi` = Contract-first aus einer Quelle |
| **API-Vertrag** | Zod-Schemas → OpenAPI 3.1 (generiert) | Ein Schema erzeugt Route-Typen, Validierung, Client, Doku — vier Artefakte, null Drift |
| **ORM** | Drizzle ORM | Schema-as-Code in TS, deterministische SQL-Migrationen, kein Magic |
| **DB lokal** | PGlite (In-Process-Postgres/WASM) | Voller Postgres-Dialekt ohne Docker — deterministisch, CI-tauglich, null Setup |
| **DB prod** | PostgreSQL (Supabase-kompatibel) | Identischer Dialekt lokal/prod → Migrations-Determinismus |
| **HTTP-Client (Frontend)** | generierter Typed Client (`src/generated/api-client.ts`) | Komponenten rufen NIE `fetch()` direkt (I-15) |
| **Deploy** | Vercel (Static + Functions) | `axm deploy` als dünner Wrapper; ein Ziel, keine Adapter-Matrix |
| **Visual-Diff** | Playwright-Screenshot + odiff | Nur mit gepinnter Umgebung (§14.3), opt-in pro Sidecar |
| **Locking** | proper-lockfile (Manifest-Mutex) | Atomare Manifest-Mutationen bei N Agenten |

**Verworfen (keine Diskussion):** Express (Typing-Steinzeit), Prisma (Runtime-Magie + Engine-Binary = Nichtdeterminismus), Docker für lokale DB (Setup-Reibung), tRPC (koppelt Client/Server-Deploy, OpenAPI-Export zweitklassig), Branch-basierte Multi-Agent-Parallelität (Merge-Konflikte sind der Tod des Determinismus — §9).

---

## 2. INVARIANTEN v2

I-01 bis I-12 gelten unverändert (Referenz: v1 §2, hier normativ übernommen):

| ID | Kurzform |
|---|---|
| I-01 | Max. 120 LOC/Datei | 
| I-02 | Max. 4096 Bytes/Datei |
| I-03 | Ein benannter Export pro Komponenten-Datei |
| I-04 | Keine Default-Exports (außer generierte Route-Wrapper) |
| I-05 | Keine Barrel-Files — Auflösung nur über Manifest |
| I-06 | Nur absolute Imports via `@/` |
| I-07 | Sidecar-Pflicht (`<Name>.spec.json`) |
| I-08 | Nur Token-Referenzen, keine Raw-Werte |
| I-09 | Kein `any`, `@ts-ignore`, `eslint-disable` |
| I-10 | Ownership-Zonen strikt |
| I-11 | Aller CLI-Output NDJSON, Fehler = FIX_PACKET |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |

**Neu:**

| ID | Invariante | Enforcement | Rationale |
|---|---|---|---|
| **I-13** | Jede Komponente rendert `data-axm-id="<Name>"` am Wurzelelement | `axiom/require-axm-id` + Codegen setzt es automatisch | E2E-Selektoren werden deterministisch; `AXM-E001`-Klasse stirbt aus |
| **I-14** | Kein API-Endpoint ohne Contract-Datei; Handler-Signatur wird aus dem Contract generiert | `axm validate --contracts`, `AXM-C001` | Contract-first ist nicht optional |
| **I-15** | Komponenten/Stores greifen nie direkt auf `fetch`/DB zu — nur via generiertem Client | `axiom/no-raw-fetch`, `AXM-C002` | Eine Aufrufkante = eine validierbare Kante |
| **I-16** | Kein Agent-Output darf einem DECISION_LEDGER-Eintrag widersprechen (maschinell prüfbare Teilmenge) | `axm validate --ledger`, `AXM-Q001`* | Anti-Re-Litigation: entschiedene Fragen bleiben entschieden |
| **I-17** | Ein Agent schreibt ausschließlich innerhalb des Scopes seiner aktiven Lease | `axm validate --ownership` + Lease-Abgleich, `AXM-M003` | Scope-Confinement macht Parallelität konfliktfrei |

*Ledger-Codes laufen unter Prefix Q (für "quorum/decision"), um Kollision mit I (Intern) zu vermeiden.

---

## 3. REPOSITORY-LAYOUT v2

```
axiom-app/
├── axiom.config.json            # LOCKED
├── agent-context.json            # MACHINE   — SSOT (erweitert: leases, orders, endpoints)
├── VISION.axm.json               # OPERATOR  — Intent-Deklaration (§10)
├── tokens.json                   # OPERATOR
├── ledger/
│   └── decisions.ndjson          # MACHINE   — append-only via `axm ledger add`
├── orders/
│   ├── open/                     # MACHINE   — WORK_ORDERs (JSON, ein Auftrag pro Datei)
│   ├── active/                   # MACHINE   — geclaimte Orders (enthalten leaseId)
│   └── done/                     # MACHINE   — abgeschlossene Orders (Audit-Trail)
├── src/
│   ├── core/                     # LOCKED
│   ├── components/               # AGENT (lease-gebunden)
│   ├── routes/                   # MACHINE
│   ├── state/                    # AGENT (lease-gebunden)
│   └── generated/                # MACHINE   — theme.css, token-types, api-client.ts, route-manifest
├── api/
│   ├── contracts/                # AGENT     — <name>.contract.ts (Zod + Route-Meta)
│   ├── handlers/                 # AGENT     — Implementierung gegen generierte Signatur
│   └── generated/                # MACHINE   — openapi.json, Handler-Typen
├── db/
│   ├── schema/                   # AGENT     — Drizzle-Schemas (gleiche LOC/Byte-Caps)
│   └── migrations/               # MACHINE   — nur via `axm db migrate gen`, hash-getrackt
├── pipeline/
│   ├── fix-packets/              # MACHINE
│   ├── ack/                      # AGENT     — Fertig-Signale des Agenten (§15.3)
│   ├── reports/                  # MACHINE
│   └── bench/                    # MACHINE   — AXIOM-Bench-Metriken (NDJSON)
├── .axiom/
│   ├── sig-index.json            # MACHINE   — vorberechneter Signatur-Index (§11.2)
│   ├── slice-cache/              # MACHINE   — Content-Hash-gecachte Slices
│   └── leases.json               # MACHINE   — aktive Leases (Mutex-geschützt)
├── e2e/                          # AGENT
├── .github/workflows/axiom.yml   # MACHINE   — CI-Pipeline (§14.2)
└── CLAUDE.md / .cursorrules      # MACHINE   — generiert, v2: inkl. Order-/Lease-Protokoll
```

Ownership-Zonen und Hash-Integrität wie v1 §3; neu ist die Kopplung AGENT-Zone ↔ aktive Lease (I-17).

---

## 4. MANIFESTE & SCHEMAS v2

### 4.1 `agent-context.json` — Erweiterungen

Zusätzlich zu den v1-Feldern (components, routes, stores, tokens, integrity, pipeline):

```json
{
  "endpoints": [
    {
      "name": "createTask",
      "method": "POST",
      "path": "/api/tasks",
      "contract": "api/contracts/tasks.contract.ts",
      "handler": "api/handlers/tasks.create.ts",
      "clientMethod": "api.tasks.create",
      "status": "GREEN"
    }
  ],
  "db": {
    "schemaFiles": ["db/schema/tasks.ts"],
    "migrationHead": "0003_bold_move.sql",
    "migrationHashes": { "0001_init.sql": "sha256:…" }
  },
  "orders": { "open": 3, "active": 2, "done": 14, "blocked": 0 },
  "agents": [
    { "agentId": "agent-a7f2", "role": "worker", "activeLease": "lease_0009", "lastHeartbeat": "2026-07-09T10:12:44Z" }
  ],
  "ledger": { "entries": 12, "lastId": "DEC-0012", "hash": "sha256:…" },
  "bench": { "lastRun": "bench_0004", "greenRateAt1": 0.86, "medianTokensToGreen": 3120 }
}
```

### 4.2 `VISION.axm.json` — Operator-Intent (neu)

Die einzige Stelle, an der der Mensch „prompted" — aber strukturiert, nicht als Prosa-Freitext:

```json
{
  "$schema": "./node_modules/@axiom/core/schemas/vision.schema.json",
  "visionId": "vis_001",
  "goal": "Task-Management-App: Boards, Tasks, Drag&Drop-frei (v1: Listen), Auth-frei (v1)",
  "entities": [
    { "name": "Board", "fields": { "title": "string(1..60)" } },
    { "name": "Task",  "fields": { "title": "string(1..120)", "done": "boolean", "boardId": "ref(Board)" } }
  ],
  "routes": [
    { "path": "/", "purpose": "Board-Übersicht" },
    { "path": "/board/:id", "purpose": "Task-Liste eines Boards, CRUD" }
  ],
  "constraints": [
    "kein LocalStorage — Persistenz nur via API",
    "alle Mutationen optimistisch mit Rollback"
  ],
  "priorities": ["Korrektheit", "a11y", "Performance", "Optik"],
  "vetoGates": ["post-plan", "pre-deploy"],
  "budgets": { "maxComponents": 20, "maxEndpoints": 10, "tokenCeilingTotal": 400000 }
}
```

**Veto-Gate-Semantik:** Bei `post-plan` stoppt `axm plan` nach DAG-Erzeugung mit Exit 0 und `"awaitingVeto": true`; Freigabe via `axm plan approve vis_001`. Ohne Freigabe claimt kein Agent Orders. `pre-deploy` analog vor `axm deploy`.

### 4.3 WORK_ORDER-Schema (neu) — das konstruktive Gegenstück zum FIX_PACKET

```json
{
  "$schema": "./node_modules/@axiom/core/schemas/work-order.schema.json",
  "orderId": "ord_0007",
  "visionId": "vis_001",
  "goal": "Komponente TaskRow: Anzeige + Toggle done via api.tasks.update",
  "scope": {
    "writeAllowed": [
      "src/components/TaskRow.tsx",
      "src/components/TaskRow.spec.json",
      "src/components/TaskRow.test.tsx"
    ],
    "readContext": "axm context slice --for src/components/TaskRow.tsx"
  },
  "dependsOn": ["ord_0003", "ord_0005"],
  "produces": { "components": ["TaskRow"], "endpoints": [] },
  "acceptance": {
    "pipelineScope": "TaskRow",
    "gherkin": [
      "Wenn done getoggelt wird, ruft die Komponente api.tasks.update genau einmal",
      "aria-checked spiegelt den done-Zustand"
    ]
  },
  "tokenBudget": 12000,
  "leaseRequired": true,
  "status": "OPEN",
  "claimedBy": null,
  "attempts": { "current": 0, "max": 2 },
  "agentInstruction": "Erzeuge zuerst das Sidecar, dann Implementierung. Schreibe NUR in scope.writeAllowed. Abschluss: axm order complete ord_0007"
}
```

**Status-Enum:** `OPEN → CLAIMED → IN_PROGRESS → REVIEW → DONE` | `BLOCKED` (Dependency RED oder Eskalation).
**DAG-Regel:** Ein Order ist nur claimbar, wenn alle `dependsOn` den Status DONE haben — maschinell erzwungen (`AXM-W002`).

### 4.4 DECISION_LEDGER-Eintrag (neu)

Append-only NDJSON, eine Entscheidung pro Zeile. Zwei Klassen: `advisory` (Kontext für Agenten) und `enforced` (maschinell prüfbar):

```json
{
  "id": "DEC-0007",
  "date": "2026-07-09",
  "scope": "global",
  "decision": "Keine Datumsbibliothek. Intl.DateTimeFormat only.",
  "rationale": "dayjs/date-fns = Dependency-Fläche ohne Bedarf bei 2 Datumsstellen",
  "class": "enforced",
  "rule": { "type": "forbidden-dependency", "match": ["dayjs", "date-fns", "moment", "luxon"] },
  "supersedes": null
}
```

**Enforcement-Regeltypen (v2):** `forbidden-dependency`, `forbidden-import-path`, `required-token-usage`, `forbidden-api-pattern` (Regex auf AST-Import-Ebene, nicht auf Rohtext). Verstoß → `AXM-Q001` mit Ledger-Referenz im FIX_PACKET.
**Anti-Re-Litigation-Regel für Agenten (in CLAUDE.md generiert):** Bevor ein Agent eine Architektur-/Dependency-Entscheidung trifft: `axm ledger query --scope <bereich>`. Widerspricht sein Plan einem Eintrag → Eskalation statt Umgehung.

### 4.5 API-Contract (`api/contracts/tasks.contract.ts`)

```ts
// AXIOM CONTRACT — Quelle für: Handler-Typ, Validierung, OpenAPI, Client (I-14)
import { z } from "zod";
import { defineContract } from "@axiom/core/contract";

export const tasksContract = defineContract({
  name: "tasks",
  routes: {
    create: {
      method: "POST", path: "/api/tasks",
      input:  z.object({ title: z.string().min(1).max(120), boardId: z.string().uuid() }),
      output: z.object({ id: z.string().uuid(), title: z.string(), done: z.boolean() }),
      errors: { 404: "BOARD_NOT_FOUND", 422: "VALIDATION" }
    },
    update: {
      method: "PATCH", path: "/api/tasks/:id",
      input:  z.object({ done: z.boolean().optional(), title: z.string().min(1).max(120).optional() }),
      output: z.object({ id: z.string().uuid(), done: z.boolean() }),
      errors: { 404: "TASK_NOT_FOUND" }
    }
  }
});
```

Daraus generiert `axm api build` (MACHINE): Hono-Router-Bindung, Handler-Signaturtypen, `openapi.json`, typisierten Frontend-Client. Handler implementieren gegen die generierte Signatur — Abweichung = `AXM-T001` beim Typecheck, nicht erst zur Laufzeit.

---

## 5. CLI-VERTRAG v2

Universalregeln aus v1 §5 unverändert (NDJSON-only, keine Interaktivität, Idempotenz).

**Exit-Codes v2 (Ergänzung):**

| Code | Bedeutung | Agent-Aktion |
|---|---|---|
| 70 | Lease-Konflikt / Scope-Verletzung | Anderen Order claimen oder auf Lease-Freigabe warten |
| 80 | Ledger-Widerspruch | Eskalation — NIE umgehen |

### 5.1 Neue Befehle

**Intent & Planung**
- **`axm plan [--vision VISION.axm.json]`** — Deterministische Dekomposition: Vision → Entitäten → DB-Schema-Orders → Contract-Orders → Handler-Orders → Client-Build → Komponenten-Orders → Route-Orders → E2E-Order. Erzeugt DAG in `orders/open/`, Topologie in `agent-context.json`. Stoppt bei Veto-Gate. Result: `{ "orders": 14, "dagDepth": 5, "awaitingVeto": true, "criticalPath": ["ord_0001","ord_0004","ord_0009"] }`
- **`axm plan approve <visionId>`** / **`axm plan reject <visionId> --reason <text>`** — Operator-Veto-Gate.
- **`axm plan replan --delta <text|json>`** — Nachträgliche Vision-Änderung: berechnet Order-Delta (neue/obsolete/invalidierte Orders), fasst DONE-Orders nie an, invalidierte gehen auf BLOCKED mit Begründung.

**Work-Orders**
- **`axm order list [--status OPEN]`** — DAG-Sicht als JSON.
- **`axm order claim <orderId> --agent <agentId>`** — Atomar (Manifest-Mutex): prüft Dependencies (DONE?), erwirbt Lease über `scope.writeAllowed`, Status → CLAIMED. Konflikt → Exit 70 / `AXM-M001`.
- **`axm order complete <orderId>`** — Führt `axm pipeline run --scope <order.pipelineScope>` aus; GREEN → Status DONE, Lease-Release, Order nach `orders/done/`; RED → FIX_PACKET, Status bleibt IN_PROGRESS, attempt++.
- **`axm order release <orderId>`** — Freiwillige Rückgabe (Status → OPEN, attempt bleibt).

**Multi-Agent**
- **`axm lease list | heartbeat --agent <id> | reclaim`** — `reclaim`: Leases ohne Heartbeat > TTL (300 s) werden freigegeben, zugehörige Orders → OPEN, attempt++ (§9.3).
- **`axm conduct --agents <n>`** — Conductor-Modus: Dispatcher-Loop, der freie Orders nach DAG-Topologie + Priorität an registrierte Agenten meldet (Ausgabe: Zuteilungsempfehlungen als NDJSON; die eigentliche Agenten-Prozesssteuerung liegt beim Operator-Tooling, §9.4).

**API & Daten**
- **`axm api add <name> --contract <path>`** — Registriert Contract, generiert Handler-Stubs + Client + OpenAPI, Manifest-Eintrag.
- **`axm api build`** — Regeneriert alle abgeleiteten Artefakte (Pflicht nach Contract-Änderung, Hash-Check).
- **`axm db migrate gen`** — drizzle-kit-Wrapper: Schema-Diff → SQL-Migration (MACHINE), Hash ins Manifest.
- **`axm db migrate apply [--env local|prod]`** — Wendet Migrationen an (lokal: PGlite; prod: DATABASE_URL), verifiziert Hash-Kette — manipulierte Migration → `AXM-D002`, Abbruch.
- **`axm db seed --fixture <path>`** — Deterministische Seeds für Tests/E2E.

**Wissen & Vermessung**
- **`axm ledger add --decision <text> --rationale <text> [--rule <json>]`** / **`axm ledger query [--scope <s>]`**
- **`axm bench run [--fixture <repo>]`** — Führt Benchmark-Suite aus (§12), schreibt `pipeline/bench/bench_XXXX.ndjson`.

**Betrieb**
- **`axm audit`** — Supply-Chain-Prüfung (§13), Fehlercodes `AXM-Sxxx`.
- **`axm deploy [--env preview|prod]`** — Build + Migrations-Check + Vercel-Deploy; respektiert `pre-deploy`-Veto-Gate.

### 5.2 Erweiterte Bestandsbefehle

- `axm pipeline run` — neu: `--parallel` (disjunkte Scopes gleichzeitig, ein Report pro Scope), Stage `visual` (opt-in), Stage `contract` (API-Konformität).
- `axm context slice` — neu: nutzt `sig-index.json` + Slice-Cache (§11.2); `--for-order <orderId>` liefert den im Order referenzierten Komplett-Kontext inkl. relevanter Contracts + Ledger-Auszug (nur `scope`-passende Einträge).
- `axm status` — neu: Orders-/Agents-/Bench-Block.

---

## 6. PIPELINE v2 — State Machine

```
VISION ──► PLAN ──► [VETO-GATE post-plan] ──► ORDER-DAG
                                                 │  (pro Order, parallel bei disjunkten Scopes)
                                                 ▼
GENERATE ─► VALIDATE ─► CONTRACT ─► TYPECHECK ─► LINT ─► UNIT ─► E2E ─► [VISUAL opt-in] ─► GREEN
    ▲           │RED        │RED        │RED       │RED    │RED    │RED       │RED
    │           ▼           ▼           ▼          ▼       ▼       ▼          ▼
    │        ┌────────────────────────────────────────────────────────────────┐
    │        │            EMIT FIX_PACKET  (attempt < max)                    │
    └────────┤                                                                │
             │  attempt ≥ max  →  ESCALATE → Order BLOCKED → Operator-Report  │
             └────────────────────────────────────────────────────────────────┘
```

**Neue Stage-Regeln:**
- **CONTRACT:** Prüft Handler gegen generierte Signaturen, Client-Nutzung gegen OpenAPI, I-14/I-15. Fehlercodes `AXM-Cxxx`.
- **VISUAL:** Nur für Komponenten mit Sidecar-Flag `"visual": true` (§14.3). Diff > Schwellwert → `AXM-E020` mit Pfaden zu expected/actual/diff-PNG im FIX_PACKET (Agent bekommt Bildpfade, Operator entscheidet bei Eskalation per Sichtung).
- **Parallelität:** `--parallel` erlaubt gleichzeitige Scope-Pipelines nur bei disjunkten Lease-Scopes; Report-Dateien sind Order-gebunden, nie gemergt.
- **Fail-fast, Retry-Hygiene (`lastAttemptDiff`), Attempt-Zählung im Packet:** unverändert aus v1 §6.

---

## 7. FEHLERPROTOKOLL v2

### 7.1 Taxonomie-Ergänzungen

| Prefix | Klasse | Beispiele |
|---|---|---|
| `AXM-Pxxx` | Plan/Intent | P001 Vision schema-invalide, P002 Entitäts-Zyklus, P003 Budget-Ceiling überschritten (Plan verlangt mehr Komponenten als `budgets.maxComponents`) |
| `AXM-Wxxx` | Work-Order | W001 Order schema-invalide, W002 Dependency nicht DONE, W003 Scope-Schreibversuch außerhalb writeAllowed, W004 attempts erschöpft |
| `AXM-Mxxx` | Multi-Agent | M001 Lease-Konflikt, M002 Heartbeat-Timeout, M003 Schreibzugriff ohne aktive Lease (I-17) |
| `AXM-Dxxx` | Daten | D001 Migration-Diff nicht deterministisch reproduzierbar, D002 Migrations-Hash-Kette gebrochen, D003 Seed-Fixture invalide |
| `AXM-Cxxx` | Contract/API | C001 Endpoint ohne Contract (I-14), C002 Raw-fetch in Komponente (I-15), C003 Handler-Signatur-Drift, C004 Client veraltet (Contract-Hash ≠ Client-Hash) |
| `AXM-Qxxx` | Ledger | Q001 Entscheidungs-Widerspruch (enforced rule), Q002 Ledger-Hash-Bruch (Manipulationsversuch) |
| `AXM-Sxxx` | Security | S001 nicht-exakte Version im package.json, S002 Audit-Finding ≥ high, S003 Lockfile-Hash-Drift, S004 Postinstall-Script erkannt |

FIX_PACKET-Schema unverändert (v1 §7.2) mit zwei neuen Feldern:

```json
{
  "orderId": "ord_0007",
  "ledgerRefs": ["DEC-0007"]
}
```

ESCALATION_REPORT unverändert (v1 §7.3), plus `orderId` und `visionId`.

---

## 8. CODEGEN v2

Templates aus v1 §8 unverändert, Ergänzungen:

- **Komponenten-Stub:** Wurzelelement erhält generiert `data-axm-id="<Name>"` (I-13).
- **Handler-Stub** (aus `axm api add`):

```ts
// api/handlers/tasks.create.ts — AGENT ZONE
// Signatur GENERIERT aus tasks.contract.ts — nicht anpassbar (AXM-C003 bei Drift)
import type { HandlerFor } from "@/api/generated/handler-types";
import { db } from "@axiom/core/db";
import { tasks } from "@/db/schema/tasks";

export const createTask: HandlerFor<"tasks.create"> = async ({ input }) => {
  const [row] = await db.insert(tasks).values({ title: input.title, boardId: input.boardId }).returning();
  return { id: row.id, title: row.title, done: row.done };
};
```

- **Contract-Block-Marker in Tests** (Resolution §15.2):

```ts
// @axiom:contract:start sha256:9f2c41…
…generierte Vertragstests…
// @axiom:contract:end
```

- **CLAUDE.md v2** (generiert, ~90 Zeilen): + Order-Lebenszyklus-Spickzettel, Lease-Protokoll, die vierte Kardinalregel: **„Frag das Ledger, bevor du entscheidest."**

---

## 9. MULTI-AGENT-ORCHESTRIERUNG (Kernkapitel v2)

### 9.1 Architekturentscheidung: Ein Working Tree, Scope-Partitionierung

**Diktat:** Parallelität entsteht durch **disjunkte Schreib-Scopes**, nicht durch Git-Branches.
**Begründung:** Merge-Konflikte sind semantisch nichtdeterministisch — ein LLM, das einen Merge auflöst, ist ein Zufallsgenerator mit Selbstbewusstsein. Das Manifest kennt den Dependency-Graphen; der Planner schneidet Orders so, dass `writeAllowed`-Mengen disjunkt sind. Was nicht disjunkt geht, wird sequenziert (DAG-Kante).

### 9.2 Lease-Protokoll

```json
{
  "leaseId": "lease_0009",
  "agentId": "agent-a7f2",
  "orderId": "ord_0007",
  "scope": ["src/components/TaskRow.tsx", "src/components/TaskRow.spec.json", "src/components/TaskRow.test.tsx"],
  "acquiredAt": "2026-07-09T10:02:00Z",
  "ttlSeconds": 300,
  "heartbeatAt": "2026-07-09T10:12:44Z"
}
```

**Regeln:**
1. Erwerb nur via `axm order claim` — atomar unter Manifest-Mutex (proper-lockfile). Zwei gleichzeitige Claims auf denselben Order: exakt einer gewinnt, der andere erhält Exit 70 mit `nextFreeOrders`-Liste im Result.
2. Jeder `axm`-Schreibbefehl validiert Zieldateien gegen die aktive Lease des aufrufenden `--agent` (I-17). Kein Lease-Match → Exit 70 / `AXM-M003`, Schreibvorgang findet nicht statt.
3. Heartbeat-Pflicht alle ≤ 60 s (`axm lease heartbeat`). 
4. **Dead-Agent-Reclamation:** `axm lease reclaim` (vom Conductor periodisch aufgerufen): Heartbeat älter als TTL → Lease weg, Order → OPEN, attempt++, teilgeschriebene Dateien werden auf letzten GREEN-Stand zurückgesetzt (Git-Checkout des letzten Pipeline-GREEN-Commits für den Scope — Voraussetzung: Pipeline committet GREEN-Stände automatisch, `axiom.config.json → "git": { "autoCommitGreen": true }`).

### 9.3 Konfliktfreiheit als Beweisführung, nicht als Hoffnung

- **Disjunktheits-Check zur Planzeit:** `axm plan` verweigert DAGs, in denen zwei parallel claimbare Orders überlappende `writeAllowed` haben (`AXM-P002`-Familie).
- **MACHINE-Zonen als Serialisierungspunkt:** Manifest, generierte Clients, Migrationen werden nie von Worker-Agenten geschrieben — nur von CLI-Befehlen unter Mutex. Damit ist die einzige Shared-Write-Ressource per Konstruktion serialisiert.
- **DB-Schema als DAG-Wurzel:** Schema-Orders sind immer Vorfahren aller Handler-/Komponenten-Orders — Migrations-Parallelität existiert nicht.

### 9.4 Conductor-Pattern (Rollentrennung)

| Rolle | Aufgaben | Schreibrechte |
|---|---|---|
| **Operator** (Mensch) | Vision, Veto-Gates, Eskalationen, Ledger-Entscheidungen | OPERATOR-Zonen |
| **Conductor** (1 Agent oder Cron) | `axm conduct`-Loop: Zuteilung, `lease reclaim`, Eskalations-Triage, Bench-Runs | keine Quellcode-Schreibrechte |
| **Worker** (N Agenten) | claim → slice → implement → complete | nur aktive Lease-Scopes |

Der Conductor schreibt nie Code — er ist Dispatcher. Das verhindert die klassische Schwarm-Pathologie, dass der Orchestrator „mal eben selbst fixt" und dabei Scopes verletzt.

**Skalierungsgrenze v2 (ehrlich):** Working-Tree-Partitionierung skaliert bis ~10 parallele Worker (Dateisystem + Pipeline-Durchsatz), nicht auf 300. Schwarm-Skalierung à la Kimi braucht Repo-Sharding pro Vision — dokumentiert als v3-Kandidat, Manifest-Design ist vorbereitet.

---

## 10. INTENT-LAYER — von Vision zu DAG (normativer Algorithmus)

```
INPUT: VISION.axm.json (schema-valide, sonst AXM-P001)
1. Entitäten → topologisch sortieren (ref-Kanten); Zyklus → AXM-P002
2. FOR entity: erzeuge Order[db-schema] → Order[migration]
3. FOR entity: erzeuge Order[contract] (CRUD-Teilmenge aus routes/purpose abgeleitet)
4. Order[api-build] (Sammelknoten, dependsOn: alle contracts)
5. FOR contract-route: Order[handler] (dependsOn: api-build, migration)
6. Komponentenzerlegung: routes → Seitenkomponenten → wiederverwendbare Kinder
   (Heuristik-Regelwerk, deterministisch: gleiche Vision ⇒ gleicher DAG, Golden-File-getestet)
7. FOR component: Order[component] (dependsOn: api-build falls Client-Nutzung)
8. FOR route: Order[route] (dependsOn: alle Kind-Komponenten)
9. Order[e2e] (Senke, dependsOn: alle routes)
10. Budgets prüfen (maxComponents/maxEndpoints/tokenCeilingTotal) → sonst AXM-P003
11. Disjunktheits-Check paralleler Ebenen (§9.3)
12. Schreibe orders/open/*, aktualisiere Manifest, stoppe an Veto-Gate
OUTPUT: DAG + criticalPath + Kostenprognose (Token-Schätzung je Order aus Bench-Historie)
```

**Determinismus-Anspruch:** Identische Vision ⇒ byte-identischer Order-Satz (Golden-File-Test, Abnahme M8). Die Dekompositions-Heuristik ist Regelwerk im Framework-Code, kein LLM-Aufruf — der Planner selbst halluziniert nicht, weil er nicht denkt.

---

## 11. TOKEN-ÖKONOMIE v2

### 11.1 Slice-Algorithmus

Unverändert normativ wie v1 §9, mit Erweiterungen:
- Schritt 5b: + Contract-Dateien aller vom Ziel genutzten Client-Methoden (voll)
- Schritt 6b: + Ledger-Einträge mit passendem `scope` (nur decision+rationale, je ≤ 2 Zeilen)
- `--for-order`: Budget aus `order.tokenBudget` statt Default

### 11.2 Performance-Infrastruktur (neu)

- **Signatur-Index** `.axiom/sig-index.json`: Bei jedem Pipeline-GREEN aktualisiert — exportierte Signaturen aller Dateien, vorextrahiert. `axm context slice` parst im Normalfall **null** TypeScript-Dateien für Tiefe-2-Kontext.
- **Slice-Cache** `.axiom/slice-cache/<sha256(target+graphHash)>.ndjson`: Cache-Hit, wenn weder Zieldatei noch Graph-Nachbarschaft sich geändert haben (Hash-Vergleich über Manifest). Slice-Latenz < 200 ms als hartes Perf-Budget (Abnahme M10).
- **Kosten-Ledger:** Jeder Slice-Abruf und jedes FIX_PACKET loggt Token-Schätzung nach `pipeline/bench/cost.ndjson` mit `orderId` — Grundlage für die Kostenprognose in `axm plan`.

---

## 12. AXIOM-BENCH — das Framework beweist seine These (neu)

**Zweck:** „Agent-native reduziert Fehlversuche" ist eine empirische Behauptung. Sie wird gemessen, nicht geglaubt.

**Metriken (pro Bench-Run, NDJSON):**

| Metrik | Definition | Zielwert v2 |
|---|---|---|
| **GreenRate@1** | Anteil Orders, deren Pipeline beim ersten `order complete` GREEN ist | ≥ 0,80 |
| **Tokens-to-Green** | Median Gesamt-Tokens (Slices + Packets) bis GREEN pro Order | ≤ 15.000 |
| **MTTH** (Mean Time to Heal) | Ø Dauer FIX_PACKET-Emission → GREEN | ≤ 2 Zyklen |
| **EscalationRate** | Anteil Orders, die BLOCKED enden | ≤ 0,05 |
| **SliceEfficiency** | Ø Slice-Tokens / Budget | ≤ 0,60 |

**Methodik:** Drei versionierte Fixture-Visionen (S/M/L: 3/12/25 Komponenten) im Framework-Repo. `axm bench run --fixture M` spielt die Vision mit einem Referenz-Agenten (konfigurierbarer Modell-Endpoint) vollständig durch und schreibt den Report. Regressionsregel: Ein Framework-Release, das GreenRate@1 um > 5 Punkte senkt, wird nicht getaggt.

---

## 13. SECURITY & SUPPLY-CHAIN (neu)

| Maßnahme | Mechanik | Fehlercode |
|---|---|---|
| **Exakt-Pinning** | `.npmrc: save-exact=true`; `axm audit` scannt package.json auf `^`/`~` | AXM-S001 |
| **Script-Verbot** | `.npmrc: ignore-scripts=true` — kein Postinstall-Code fremder Pakete | AXM-S004 |
| **Lockfile-Integrität** | `pnpm-lock.yaml`-Hash im Manifest (`integrity`); Drift ohne CLI-Install → Abbruch | AXM-S003 |
| **Audit-Gate** | `axm audit` wrappt `pnpm audit --json`; Findings ≥ high blockieren `axm deploy` | AXM-S002 |
| **Dependency-Zugang** | Neue Dependencies NUR via `axm deps add <pkg@exact>` (prüft Ledger-`forbidden-dependency`, aktualisiert Hashes) — direktes `pnpm add` durch Agenten erzeugt S003 beim nächsten validate | AXM-S003/Q001 |
| **Secrets** | Nie im Repo; `axm deploy` liest ausschließlich Vercel-Env; `axiom/no-secret-literal`-Lintregel (Entropie-Heuristik auf String-Literale) | AXM-S005 |

---

## 14. CI/CD, DEPLOY & VISUAL GATE

### 14.1 Deploy-Fluss

`axm deploy --env prod` = Sequenz: `audit` → `pipeline run` (voll) → Migrations-Dry-Run gegen prod-Schema (`AXM-D002`-Check) → Veto-Gate `pre-deploy` → `vercel deploy --prod`. Jeder Schritt NDJSON, jeder Abbruch ein FIX_PACKET.

### 14.2 GitHub-Actions-Skeleton (generiert von `axm init`)

```yaml
# .github/workflows/axiom.yml — MACHINE ZONE
name: axiom
on: [push, pull_request]
jobs:
  pipeline:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm axm audit
      - run: pnpm axm validate
      - run: pnpm axm pipeline run
      - name: Upload FIX_PACKETs on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with: { name: fix-packets, path: pipeline/fix-packets/ }
```

**Headless-Heal (optional, Repo-Setting):** Ein CI-Job, der bei RED das FIX_PACKET an einen API-Agenten (Modell-Endpoint aus Repo-Secret) übergibt, den Patch als PR-Commit anwendet und re-runt — maximal `maxRetries`, dann PR-Kommentar mit ESCALATION_REPORT. Der Selbstheilungs-Loop läuft damit auch ohne lokale Agenten-Session.

### 14.3 Visual Gate — Determinismus-Bedingungen (opt-in)

Pixel-Diffs sind nur zulässig, wenn alle vier Pins aktiv sind, sonst verweigert die Stage den Start (`AXM-E021`):
1. Playwright-Chromium-Version exakt gepinnt (Lockfile),
2. Viewport fix 1280×720, deviceScaleFactor 1,
3. **Keine Systemfonts:** Inter wird lokal mitgeliefert und via `@font-face` erzwungen; `font-display: block`,
4. Animationen global deaktiviert im Test-Modus (`prefers-reduced-motion` forciert + CSS-Kill-Switch in `core/`).

Diff-Engine odiff, Toleranz: antialiasing-aware, Schwellwert 0,1 % Pixelanteil. Baseline-Update ist Operator-Handlung: `axm visual approve <component>` (nie automatisch, nie durch Worker).

---

## 15. RESOLUTIONEN DER v1-LÜCKEN (alle geschlossen)

| v1-Lücke | Resolution (verbindlich) |
|---|---|
| **P1 — Tailwind-v4-Theme aus tokens.json** | Diktat: `axm tokens build` generiert `src/generated/theme.css` mit CSS-Custom-Properties **und** einem `@theme inline`-Block, der die Properties auf Tailwind-Namespaces mappt (`--color-action-primary` → `bg-action-primary`). Fallback-Pfad entfällt — Custom Properties sind die Quelle, `@theme` ist Projektion. Golden-File-Test in M3. |
| **P1 — Contract-Block-Hashing in Tests** | Marker-Syntax normiert: `// @axiom:contract:start sha256:<hash>` … `// @axiom:contract:end`. Hash = SHA-256 des normalisierten Blockinhalts (Zeilenenden LF, getrimmt). Parser ist zeilenbasiert (kein AST nötig), Manipulation → `AXM-V011` mit Blockreferenz. |
| **P2 — heal-Watcher-Semantik** | Kein File-Watching-Raten: Der Agent signalisiert Abschluss durch Schreiben von `pipeline/ack/<packetId>` (leere Datei). `axm heal --auto` pollt ausschließlich das ack-Verzeichnis (Intervall 500 ms). Deterministisch, debounce-frei. |
| **P2 — E2E-Selektorstrategie** | Zur Invariante erhoben: **I-13** (`data-axm-id`), Codegen setzt automatisch, Lint erzwingt. Playwright-Helfer `axmSelect("<Name>")` im Core. |

---

## 16. BAUPLAN v2 — Meilensteine M7–M12

M0–M6 unverändert aus v1 §10 (inkl. §15-Resolutionen, die in M0/M3/M4 einfließen). Reihenfolge fix, GREEN-Gate zwischen Meilensteinen.

| MS | Deliverable | Abnahmekriterium (hart) |
|---|---|---|
| **M7** | API- & Datenschicht: `defineContract`, `axm api add/build`, Drizzle+PGlite, `axm db migrate gen/apply`, Stages CONTRACT | Fixture-Contract → Handler-Stub + Client + OpenAPI byte-deterministisch; manipulierte Migration → AXM-D002; Raw-fetch-Fixture → AXM-C002 |
| **M8** | Intent-Layer: Vision-Schema, `axm plan` (Dekompositions-Regelwerk), Veto-Gates, `replan --delta` | Golden-File: identische Vision ⇒ byte-identischer Order-Satz; Zyklus-Fixture → AXM-P002; Budget-Fixture → AXM-P003 |
| **M9** | Multi-Agent: Leases, Mutex-Claims, Heartbeat/Reclaim, I-17-Enforcement, `axm conduct` | Stresstest: 8 simulierte Agenten × 200 Claim-Versuche auf 40 Orders → null Doppel-Leases, null Scope-Verletzungen (Property-Test); Dead-Agent-Fixture → Reclaim + Rollback auf letzten GREEN-Commit |
| **M10** | Ledger + Token-Ökonomie v2: `axm ledger`, Q-Enforcement, sig-index, Slice-Cache, Kosten-Ledger | forbidden-dependency-Fixture → AXM-Q001; Slice-Latenz p95 < 200 ms auf 30-Komponenten-Repo; Cache-Hit-Rate > 80 % im Wiederhol-Lauf |
| **M11** | Security + CI/CD + Deploy: `axm audit/deps add/deploy`, Actions-Workflow, Headless-Heal | Alle S-Fixtures liefern korrekte Codes; CI-Lauf auf Fixture-Repo grün; Headless-Heal schließt einen präparierten Fehler autonom im PR |
| **M12** | Visual Gate + AXIOM-Bench + Gesamt-Abnahme | Bench-Fixture M: GreenRate@1 ≥ 0,80 dokumentiert; Szenario S-12 grün |

### Abnahmeszenarien v2 (Gherkin, verbindlich — ergänzt S-01…S-06 aus v1)

```gherkin
Szenario S-07: Vision zu DAG, deterministisch
  Angenommen eine schema-valide VISION.axm.json mit 2 Entitäten und 2 Routen
  Wenn "axm plan" zweimal auf frischen Kopien läuft
  Dann sind beide Order-Sätze byte-identisch
  Und kein Order ist claimbar, solange das post-plan-Veto nicht approved ist

Szenario S-08: Lease-Härte unter Parallelität
  Angenommen zwei Agenten claimen gleichzeitig ord_0007
  Wenn beide "axm order claim" ausführen
  Dann erhält genau einer die Lease
  Und der andere Exit-Code 70 mit einer nextFreeOrders-Liste
  Und ein Schreibversuch des Verlierers in den Scope erzeugt AXM-M003 ohne Dateiänderung

Szenario S-09: Dead-Agent-Reclamation
  Angenommen agent-a7f2 hält lease_0009 und sendet 300 Sekunden keinen Heartbeat
  Wenn "axm lease reclaim" läuft
  Dann ist ord_0007 wieder OPEN mit attempt.current == 1
  Und der Scope entspricht dem letzten GREEN-Commit

Szenario S-10: Ledger schlägt Agent
  Angenommen DEC-0007 verbietet dayjs (enforced)
  Wenn ein Agent dayjs importiert und "axm validate" läuft
  Dann Exit-Code 80 und das FIX_PACKET referenziert DEC-0007 in ledgerRefs
  Und die agentInstruction verlangt Eskalation statt Workaround

Szenario S-11: Contract-Drift ist unmöglich
  Angenommen tasks.contract.ts wird geändert ohne "axm api build"
  Wenn die Pipeline läuft
  Dann schlägt Stage CONTRACT mit AXM-C004 fehl, bevor Typecheck beginnt

Szenario S-12: Prompt-to-Product (Gesamt-Abnahme)
  Angenommen ein frisches Repo und die Fixture-Vision M (12 Komponenten, 6 Endpoints)
  Wenn Operator approved und 4 Worker-Agenten den DAG abarbeiten
  Dann endet jeder Order GREEN oder eskaliert protokolliert
  Und "axm deploy --env preview" liefert eine lauffähige URL
  Und der Bench-Report weist GreenRate@1 ≥ 0,80 aus
  Und kein Schreibzugriff erfolgte je außerhalb einer aktiven Lease
```

---

## 17. EXPLIZITE NICHT-ZIELE (v2)

- **Kein Plugin-System** — bleibt verboten; Erweiterbarkeit bleibt der Feind des Determinismus.
- **Kein LLM im Framework-Kern** — Planner, Slicer, Packets sind Regelwerk-Code. Das einzige LLM im System ist der Agent davor.
- **Keine 300-Agenten-Schwärme** — Working-Tree-Modell deckelt bei ~10 Workern; Repo-Sharding = v3.
- **Kein Auth/Multi-Tenancy im Generat** — App-Feature, kein Framework-Feature; v3-Kandidat als Vision-Baustein.
- **Kein RAG/Embedding-Index** — der Signatur-Index ist exakt, nicht semantisch. Semantische Suche wäre Nichtdeterminismus durch die Hintertür.

---

## 18. KONFIDENZ- UND LÜCKENREPORT v2

**Gesamtkonfidenz: 84 %** (breiterer Scope als v1 drückt den Schnitt; Kernpfad bleibt hoch)

| Bereich | Konfidenz | Kommentar |
|---|---|---|
| Manifeste/Invarianten/CLI-Erweiterung | 94 % | Handwerk auf v1-Fundament |
| Contract-first-Kette (Zod→Hono→Client) | 90 % | `@hono/zod-openapi` ist etabliert; Restrisiko: OpenAPI-Edge-Cases bei verschachtelten Fehlern |
| Lease-Protokoll/Mutex | 88 % | proper-lockfile ist battle-tested; Property-Test M9 ist der Beweis |
| Plan-Dekomposition (deterministisches Regelwerk) | 78 % | Komponentenzerlegungs-Heuristik (Schritt 6) braucht 2–3 Iterationen an Fixture-Visionen, bis die Schnitte „gut" sind — Determinismus ist garantiert, Schnitt-Qualität ist empirisch |
| PGlite-Parität zu prod-Postgres | 80 % | Dialekt identisch; Extensions (z. B. pgvector) sind die bekannte Grenze — v2 nutzt keine |
| Visual Gate Determinismus | 75 % | Font-/AA-Pinning deckt 95 % der Flakiness; GPU-Rasterisierungs-Restvarianz auf CI-Runnern beobachten (M12) |
| Bench-Zielwerte | 70 % | GreenRate@1 ≥ 0,80 ist Setzung, nicht Messung — erste echte Zahlen kalibrieren die Ziele in M12 |

**Lücken (P-Tier):**
- **P1 — Rollback-Granularität bei Reclaim:** „letzter GREEN-Commit für den Scope" setzt `autoCommitGreen` voraus; Verhalten bei deaktiviertem Git (reine Sandbox) ungespect → Entscheidung vor M9: Git wird Pflicht-Dependency des Frameworks (empfohlen) oder Snapshot-Verzeichnis als Fallback.
- **P1 — Headless-Heal-Sicherheit:** CI-Agent mit Schreibrechten auf PRs braucht Guardrails (Scope-Whitelist im Workflow, kein Zugriff auf `.github/` und LOCKED) — Spezifikation des Workflow-Permission-Sets vor M11.
- **P2 — Kostenprognose-Kaltstart:** `axm plan` schätzt Token-Kosten aus Bench-Historie; ohne Historie (frisches Framework) braucht es Default-Tabellen pro Order-Typ — einmalig aus den Fixture-Runs ableiten (M12), bis dahin konservative Konstanten.
- **P2 — `replan --delta`-Semantik bei aktiven Leases:** Invalidiert ein Replan einen gerade bearbeiteten Order? Vorschlag: aktive Orders laufen zu Ende, Invalidierung greift erst bei complete — vor M8 festzurren.
- **P3 — v3-Horizont:** Repo-Sharding für echte Schwärme, Auth-Baustein, pgvector-Pfad — Manifest- und Order-Design sind darauf vorbereitet, nichts davon blockiert v2.

**Offene Operator-Entscheidungen: exakt eine** — Git als harte Framework-Dependency (P1 oben). Empfehlung steht im Report; alles andere ist diktiert.
