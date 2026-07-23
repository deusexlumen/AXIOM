# AXIOM v2.0 Phase 4 — M7: API & Data Layer

> Ziel: Contract-first API mit `defineContract`, `axm api add/build`, Drizzle + PGlite, Migrationen und Pipeline-Stage `CONTRACT`. Alle Abnahmekriterien aus AXIOM_SPEC_v2.0.md §16 M7 erfüllt.

## Ausgangszustand

- M0–M6 sind implementiert und werden gerade final verifiziert.
- CLI-Struktur: `src/cli/bin.ts`, `src/cli/commands/*.ts`, `src/cli/pipeline/stages/*.ts`, `src/cli/schemas/agent-context.ts`, `src/cli/templates/*`.
- Pipeline-Stages aktuell: `validate → typecheck → lint → unit → e2e`.
- Es gibt noch keine API-/DB-Schemas, Commands oder Templates.

## Task-Übersicht

### Task 1 — Dependencies & Tooling

**Dateien:** `package.json`, `.npmrc` (neu im generierten App-Template)

**Änderungen:**
- `@axiom/cli` devDependencies/Dependencies erweitern:
  - `hono`: "4.7.5"
  - `@hono/zod-openapi`: "0.19.4"
  - `drizzle-orm`: "0.41.0"
  - `drizzle-kit`: "0.30.6"
  - `@electric-sql/pglite`: "0.2.17"
  - `zod`: "^4.4.3" (bereits vorhanden)
- Generiertes App-Template (`src/cli/templates/package-json.ts`) um Backend-Dependencies erweitern.
- `.npmrc` im generierten App-Template erzeugen mit:
  - `save-exact=true`
  - `ignore-scripts=true`

**Abnahme:** `pnpm install` im Framework-Repo und in einer frischen Scaffold-App läuft ohne Konflikte.

---

### Task 2 — Schemas erweitern

**Dateien:**
- `src/cli/schemas/agent-context.ts`
- Neu: `src/cli/schemas/contract.ts`
- Neu: `src/cli/schemas/db.ts`

**Änderungen in `agent-context.ts`:**
- `EndpointEntry` hinzufügen:
  - `name`, `method`, `path`, `contract`, `handler`, `clientMethod`, `status`
- `DbEntry` hinzufügen:
  - `schemaFiles`, `migrationHead`, `migrationHashes`
- `AgentContext` erweitern um:
  - `endpoints: EndpointEntry[]`
  - `db: DbEntry`
  - `orders`, `agents`, `ledger`, `bench` als optionale V2-Platzhalter (für M8–M10)
- Keine Default-Exports, keine Barrel-Files.

**Neu `src/cli/schemas/contract.ts`:**
- `ContractRoute` Zod-Schema:
  - `method` (GET/POST/PATCH/PUT/DELETE)
  - `path`
  - `input` (Zod-Schema-Referenz als String, nicht als Runtime-Objekt)
  - `output`
  - `errors` (Record<number, string>)
- `ContractDefinition` Schema mit `name` und `routes`.
- TypeScript-Typen exportieren.

**Neu `src/cli/schemas/db.ts`:**
- `MigrationHash` Schema: `{ file, hash }`
- `DbContext` Schema wie oben.

**Abnahme:** `pnpm build` grün; Zod-Schemas validieren Beispiel-Daten.

---

### Task 3 — `defineContract` Helper

**Datei:** `src/cli/api/contract.ts`

**Implementierung:**
- `defineContract(def: ContractDefinition): ContractDefinition`
- Reiner TypeScript-Helper, keine Runtime-Logik außer Rückgabe.
- Zusätzlich: `contractHash(contract: ContractDefinition): string` — SHA-256 über normalisierte JSON-Repräsentation.

**Abnahme:** Unit-Test: `defineContract({...})` gibt identisches Objekt zurück; `contractHash` ist deterministisch.

---

### Task 4 — `axm api add` und `axm api build`

**Dateien:**
- `src/cli/commands/api.ts` (neu)
- `src/cli/bin.ts` (registriert `api`)
- `src/cli/templates/api/` (neu)

**`api add <name> --contract <path>`:**
- Liest Contract-Datei per ts-morph (oder direkt als Modul) ein.
- Validiert gegen `ContractDefinition` Schema.
- Schreibt:
  - `api/contracts/<name>.contract.ts` (Kopie des Input-Contracts)
  - `api/handlers/<name>.<route>.ts` pro Route (Stub)
  - `src/generated/api-client.ts` (generierter typisierter Client)
  - `api/generated/openapi.json`
- Aktualisiert `agent-context.json`:
  - `endpoints[]`
  - `integrity.machineFiles` für generierte Dateien

**`api build`:**
- Iteriert über `agent-context.json → endpoints`.
- Regeneriert `src/generated/api-client.ts` und `api/generated/openapi.json`.
- Prüft Contract-Hash gegen generierte Artefakte; bei Drift `AXM-C004`.

**Templates (`src/cli/templates/api/`):**
- `handler-stub.ts`
- `client.ts`
- `openapi.ts`

**CLI-Registrierung:**
- `src/cli/bin.ts` um `api` erweitern. Da `bin.ts` knapp an 120 LOC ist, Command-Routing in `src/cli/bin-commands.ts` auslagern oder `apiCommand`/`dbCommand` direkt importieren.

**Abnahme:** Integrationstest: Fixture-Contract → Handler-Stubs + Client + OpenAPI byte-deterministisch.

---

### Task 5 — `axm db migrate gen/apply` und `axm db seed`

**Dateien:**
- `src/cli/commands/db.ts` (neu)
- `src/cli/templates/db/` (neu)
- `src/cli/bin.ts`

**`db migrate gen`:**
- Wrapper um `drizzle-kit generate`.
- Schreibt Migration nach `db/migrations/`.
- Berechnet SHA-256 der neuen `.sql`-Datei und aktualisiert `agent-context.json → db.migrationHashes`.
- Setzt `db.migrationHead`.

**`db migrate apply [--env local|prod]`:**
- Lokal: PGlite-Instanz in `@axiom/core/db` öffnen, Migrationen ausführen.
- Prod: `DATABASE_URL` aus Env verwenden (nur Wrapper, kein Live-Test).
- Verifiziert Hash-Kette: jede angewendete Migration muss im Manifest mit passendem Hash stehen.
- Abweichung → `AXM-D002`.

**`db seed --fixture <path>`:**
- Lädt JSON-Fixture und führt deterministische Inserts über Drizzle-ORM aus.

**Templates (`src/cli/templates/db/`):**
- `schema-stub.ts`
- `drizzle-config.ts`
- `pglite-client.ts` (für generierte App)

**Abnahme:**
- Manipulierte Migration (Hash geändert) → `AXM-D002`.
- Seed-Fixture → DB-Zeilen deterministisch.

---

### Task 6 — Pipeline-Stage `CONTRACT`

**Dateien:**
- `src/cli/pipeline/stages/contract.ts` (neu)
- `src/cli/commands/pipeline.ts` (Stage registrieren)
- `src/cli/templates/manifest.ts` (Stage in `axiom.config.json` ergänzen)

**Implementierung:**
- Läuft nach `validate`, vor `typecheck`.
- Prüft:
  1. Jeder Endpoint in `agent-context.json` hat eine Contract-Datei (I-14) → sonst `AXM-C001`.
  2. Jeder Handler importiert und verwendet `HandlerFor<"name.route">` aus generierten Typen.
  3. `src/generated/api-client.ts` Hash stimmt mit Contract-Hash überein → sonst `AXM-C004`.
  4. Raw `fetch` in `src/components/**` oder `src/state/**` → `AXM-C002`.

**Integration:**
- `STAGES` Array in `pipeline.ts` um `{ name: "contract", run: runContractStage }` erweitern.
- `StageName` Typ in `types.ts` um `"contract"` erweitern.
- `axiom.config.json` Template: `stages: ["validate", "contract", "typecheck", "lint", "unit", "e2e"]`.

**Abnahme:** Pipeline-Integrationstest mit Contract-Drift liefert `AXM-C004`.

---

### Task 7 — Lint-Regeln für I-14/I-15 (Vorbereitung)

**Dateien:**
- `packages/eslint-plugin-axiom/src/rules/` (neu)

**Implementierung (optional in M7, hart in M8):**
- `axiom/no-raw-fetch`: Sucht nach `fetch(` Aufrufen in AGENT-Zonen.
- `axiom/require-contract`: Stellt sicher, dass API-Methoden nur aus generiertem Client kommen.

**Abnahme:** Raw-fetch-Fixture → `AXM-C002`.

---

### Task 8 — Integrationstests & Fixtures

**Neue Testdateien:**
- `src/cli/commands/api.integration.test.ts`
- `src/cli/commands/db.integration.test.ts`
- `src/cli/pipeline/stages/contract.integration.test.ts`

**Fixtures:**
- `test/fixtures/contracts/tasks.contract.ts`
- `test/fixtures/db/tasks-seed.json`
- Verstoß-Fixture: Migration-Hash manipuliert → `AXM-D002`.
- Verstoß-Fixture: Component mit `fetch(...)` → `AXM-C002`.

**Golden-File-Test:**
- `axm api build` zweimal auf identischem Contract → byte-identische `api-client.ts` + `openapi.json`.

---

### Task 9 — Exit-Gate

**Befehl:** `pnpm build && pnpm test && pnpm run test:integration`

**Akzeptanzkriterien:**
- Build grün.
- Unit-Tests grün.
- Integrationstests grün (inkl. neuen M7-Tests).
- Keine Default-Exports (außer Route-Wrapper).
- Keine Barrel-Files.
- Keine `any`-Typen, kein `@ts-ignore`, kein `eslint-disable`.

---

## Abhängigkeiten zwischen Tasks

```
Task 1 (Deps) → Task 2 (Schemas) → Task 3 (defineContract)
Task 3 → Task 4 (api commands)
Task 2 → Task 5 (db commands)
Task 4 + Task 5 → Task 6 (CONTRACT stage)
Task 6 → Task 8 (Integrationstests)
Task 9 hinter Task 8
```

## Hinweise für Implementierer

- Jede neue Datei ≤ 120 LOC und ≤ 4096 Bytes.
- Imports immer absolut via `@/`.
- CLI-Output immer NDJSON; Fehler immer FIX_PACKET.
- Generierte Dateien in `src/generated/` und `api/generated/` als MACHINE markieren.
- AGENT-Zonen: `api/contracts/`, `api/handlers/`, `db/schema/`.
