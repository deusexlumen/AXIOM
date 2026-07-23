# AXIOM v2.0 Phase 5 — M8: Intent-Layer

> Ziel: `VISION.axm.json`, `axm plan`, Veto-Gates, `replan --delta`; identische Vision ⇒ byte-identischer Order-Satz.

## Ausgangszustand

- M7 ist implementiert und wird final verifiziert.
- `agent-context.json` hat bereits optionale Platzhalter für `orders`, `agents`, `ledger`, `bench`.
- Es gibt noch keine `VISION.axm.json`, Work-Order-Schemas oder Planner-Implementierung.

## Task-Übersicht

### Task 1 — Schemas

**Dateien:**
- Neu: `src/cli/schemas/vision.ts`
- Neu: `src/cli/schemas/work-order.ts`
- Update: `src/cli/schemas/agent-context.ts` (Vision-Referenz, Order-Status-Enum)

**Vision-Schema (`VISION.axm.json`):**
- `visionId`, `goal`, `entities` (name + fields), `routes` (path + purpose), `constraints`, `priorities`, `vetoGates`, `budgets`.
- Fields als String-Typen wie `string(1..120)`, `boolean`, `ref(Entity)`.

**Work-Order-Schema:**
- `orderId`, `visionId`, `goal`, `scope.writeAllowed[]`, `scope.readContext`, `dependsOn[]`, `produces`, `acceptance`, `tokenBudget`, `leaseRequired`, `status`, `claimedBy`, `attempts`, `agentInstruction`.
- Status-Enum: `OPEN → CLAIMED → IN_PROGRESS → REVIEW → DONE | BLOCKED`.

### Task 2 — `axm plan`

**Datei:** `src/cli/commands/plan.ts`

**Algorithmus (§10 normativ):**
1. Vision laden & schema-validieren (`AXM-P001`).
2. Entitäten topologisch sortieren; Zyklus → `AXM-P002`.
3. Pro Entity: `Order[db-schema]` + `Order[migration]`.
4. Pro Entity: `Order[contract]` (CRUD aus routes/purpose abgeleitet).
5. `Order[api-build]` (dependsOn: alle contracts).
6. Komponentenzerlegung: routes → Seitenkomponenten → Kinder (deterministische Heuristik).
7. Pro Komponente: `Order[component]` (dependsOn: api-build falls Client-Nutzung).
8. Pro Route: `Order[route]` (dependsOn: Kind-Komponenten).
9. `Order[e2e]` (Senke).
10. Budgets prüfen (`AXM-P003`).
11. Disjunktheits-Check paralleler Ebenen (`AXM-P002`-Familie).
12. `orders/open/<orderId>.json` schreiben; `agent-context.json` aktualisieren.
13. Veto-Gate `post-plan`: stoppe mit Exit 0 + `awaitingVeto: true`.

**Output:** `{ orders, dagDepth, awaitingVeto, criticalPath }`.

### Task 3 — `axm plan approve/reject`

**Datei:** `src/cli/commands/plan.ts` (erweitert)

- `axm plan approve <visionId>`: setzt Vision-Status auf `APPROVED`; Orders werden claimbar.
- `axm plan reject <visionId> --reason <text>`: löscht offene Orders oder setzt sie auf `BLOCKED`.

### Task 4 — `axm plan replan --delta`

**Datei:** `src/cli/commands/plan.ts` (erweitert)

- Lädt bestehende Orders.
- Wendet Delta auf Vision an.
- Berechnet Order-Delta: neu / obsolet / invalidiert.
- DONE-Orders werden nie angerührt.
- Invalidierte Orders → `BLOCKED` mit Begründung.
- Aktive Orders laufen zu Ende (Resolution §18 Lücke P2).

### Task 5 — Integrationstests

**Dateien:**
- `src/cli/commands/plan.integration.test.ts`
- `test/fixtures/vision/*.json`

**Tests:**
- Identische Vision ⇒ byte-identischer Order-Satz (Golden-File).
- Entitätszyklus → `AXM-P002`.
- Budget-Ceiling → `AXM-P003`.
- Veto-Gate: vor Approval nicht claimbar.

---

## Exit-Gate

`pnpm build && pnpm test && pnpm run test:integration` grün.
