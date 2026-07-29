# M1 — Manifest-Kern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `agent-context.json` ist die Single Source of Truth (SSOT): vier valide Zod-Schemas (Component, Token, Config, FIX_PACKET), deterministischer Reader/Writer und SHA-256-Hash-Integrität für MACHINE-/LOCKED-Dateien.

**Architecture:** Zod-Schemas leben unter `src/cli/schemas/` und exportieren sowohl TypeScript-Typen (`z.infer`) als auch JSON-Schema (`zodToJsonSchema`). Ein Manifest-Modul (`src/cli/manifest/`) kapselt Lesen, Schreiben und Hash-Berechnung. `axm init` schreibt bereits beim Scaffolding korrekte Hashes. `axm validate` prüft Schema- und Hash-Integrität.

**Tech Stack:** TypeScript 5.x, Zod 4, `zod-to-json-schema`, `fast-check` für Property-Tests.

---

## File Structure

### Framework-Repo (neu oder geändert)

| File | Responsibility |
|---|---|
| `src/cli/schemas/agent-context.ts` | Zod-Schema für `agent-context.json` + Type + JSON-Schema |
| `src/cli/schemas/component-spec.ts` | Zod-Schema für `<Name>.spec.json` + Type + JSON-Schema |
| `src/cli/schemas/tokens.ts` | Zod-Schema für `tokens.json` + Type + JSON-Schema |
| `src/cli/schemas/config.ts` | Zod-Schema für `axiom.config.json` + Type + JSON-Schema |
| `src/cli/schemas/fix-packet.ts` | Zod-Schema für `FIX_PACKET` + Type + JSON-Schema |
| `src/cli/schemas/index.ts` | **Kein Barrel-File** — dieses Modul wird in M2 gelöscht; jeder Consumer importiert direkt |
| `src/cli/manifest/hash.ts` | SHA-256-Hash einer Datei / eines Strings |
| `src/cli/manifest/reader.ts` | `readAgentContext(cwd)` → geparstes + validiertes Manifest |
| `src/cli/manifest/writer.ts` | `writeAgentContext(cwd, manifest)` → deterministisch geschrieben |
| `src/cli/manifest/integrity.ts` | Hash-Integrität aller MACHINE/LOCKED-Dateien berechnen/verifizieren |
| `src/cli/commands/validate.ts` | `axm validate [--scope]` — Schema + Integrität |
| `src/cli/bin.ts` | `validate`-Befehl registrieren |
| `src/cli/templates/manifest.ts` | `agentContextJson()` erzeugt valides initiales Manifest mit echten Hashes |
| `src/cli/commands/init.ts` | Nutzt `writeAgentContext` und berechnet Token-Hash |
| `src/cli/manifest/reader.test.ts` | Unit-Tests für Reader/Writer |
| `src/cli/manifest/integrity.test.ts` | Unit-Tests für Hash-Integrität |
| `src/cli/schemas/agent-context.property.test.ts` | Property-Test: 1.000 Mutationen bleiben schema-valide |

### Generierte AXIOM-App

| File | Responsibility |
|---|---|
| `agent-context.json` | SSOT mit echten Hashes |
| `tokens.json` | Wird gehasht und Hash im Manifest gespeichert |

---

## Task 1: Zod-Schemas erstellen

**Files:**
- Create: `src/cli/schemas/agent-context.ts`
- Create: `src/cli/schemas/component-spec.ts`
- Create: `src/cli/schemas/tokens.ts`
- Create: `src/cli/schemas/config.ts`
- Create: `src/cli/schemas/fix-packet.ts`

- [ ] **Step 1: Installiere `zod` und `zod-to-json-schema` im Framework-Repo**

Run: `pnpm add zod zod-to-json-schema` (dependencies, nicht devDependencies, da die CLI sie zur Laufzeit braucht).
Run: `pnpm add -D fast-check` (Property-Tests).
Run: `pnpm install`.

- [ ] **Step 2: Erstelle `src/cli/schemas/component-spec.ts`**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const PropType = z.enum(["string", "number", "boolean", "enum", "function"]);

export const PropSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    required: z.boolean().default(false),
    constraints: z.object({ minLength: z.number().optional(), maxLength: z.number().optional() }).optional(),
  }),
  z.object({
    type: z.literal("number"),
    required: z.boolean().default(false),
    constraints: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  }),
  z.object({
    type: z.literal("boolean"),
    required: z.boolean().default(false),
    default: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("enum"),
    required: z.boolean().default(false),
    values: z.array(z.string()).min(1),
    default: z.string().optional(),
  }),
  z.object({
    type: z.literal("function"),
    required: z.boolean().default(false),
    signature: z.string(),
  }),
]);

export const ComponentSpec = z.object({
  $schema: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  props: z.record(z.string(), PropSchema).default({}),
  states: z.array(z.string()).default([]),
  a11y: z.object({
    role: z.string(),
    focusable: z.boolean(),
    minTouchTarget: z.string().optional(),
    requiredAria: z.array(z.string()).default([]),
  }),
  tokensUsed: z.array(z.string()).default([]),
  forbidden: z.array(z.string()).default([]),
});

export type ComponentSpec = z.infer<typeof ComponentSpec>;

export const ComponentSpecJsonSchema = zodToJsonSchema(ComponentSpec, { name: "component-spec" });
```

- [ ] **Step 3: Erstelle `src/cli/schemas/tokens.ts`**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const TokenValue = z.union([z.string(), z.record(z.string(), z.lazy(() => TokenValue))]);
export const Tokens = z.record(z.string(), TokenValue);

export type Tokens = z.infer<typeof Tokens>;

export const TokensJsonSchema = zodToJsonSchema(Tokens, { name: "tokens" });
```

- [ ] **Step 4: Erstelle `src/cli/schemas/config.ts`**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const AxiomConfig = z.object({
  budgets: z.object({
    maxLocPerFile: z.number().int().positive(),
    maxBytesPerFile: z.number().int().positive(),
    maxRetries: z.number().int().positive(),
  }),
  pipeline: z.object({
    stages: z.array(z.enum(["validate", "typecheck", "lint", "unit", "e2e"])),
    e2eOn: z.enum(["route-change", "always", "never"]),
  }),
  context: z.object({
    sliceDepth: z.number().int().nonnegative(),
    signatureOnlyBeyondDepth: z.number().int().nonnegative(),
  }),
});

export type AxiomConfig = z.infer<typeof AxiomConfig>;

export const AxiomConfigJsonSchema = zodToJsonSchema(AxiomConfig, { name: "axiom-config" });
```

- [ ] **Step 5: Erstelle `src/cli/schemas/fix-packet.ts`**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const FixPacket = z.object({
  packetId: z.string(),
  runId: z.string(),
  attempt: z.object({ current: z.number().int().nonnegative(), max: z.number().int().positive() }),
  errorCode: z.string(),
  stage: z.enum(["validate", "typecheck", "lint", "unit", "e2e", "generate"]),
  severity: z.enum(["BLOCKING", "WARNING"]),
  target: z.object({
    component: z.string().optional(),
    file: z.string(),
    line: z.number().int().positive().optional(),
    column: z.number().int().positive().optional(),
  }),
  message: z.string(),
  rawEvidence: z.record(z.string(), z.unknown()).default({}),
  probableCause: z.string(),
  fixHint: z.string(),
  lastAttemptDiff: z.string().optional(),
  contextSlice: z.object({ command: z.string(), estimatedTokens: z.number().int().nonnegative() }).optional(),
  invariantsAffected: z.array(z.string()).default([]),
  agentInstruction: z.string(),
});

export type FixPacket = z.infer<typeof FixPacket>;

export const FixPacketJsonSchema = zodToJsonSchema(FixPacket, { name: "fix-packet" });
```

- [ ] **Step 6: Erstelle `src/cli/schemas/agent-context.ts`**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const Status = z.enum(["GREEN", "RED", "STALE", "ORPHAN"]);

export const ComponentEntry = z.object({
  name: z.string(),
  file: z.string(),
  spec: z.string(),
  test: z.string(),
  exports: z.array(z.string()),
  dependsOn: z.array(z.string()).default([]),
  usedBy: z.array(z.string()).default([]),
  loc: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
  status: Status,
  specHash: z.string(),
  lastPipelineRun: z.string().datetime().optional(),
});

export const RouteEntry = z.object({
  path: z.string(),
  component: z.string(),
  file: z.string(),
});

export const StoreEntry = z.object({
  name: z.string(),
  file: z.string(),
  shapeHash: z.string(),
});

export const AgentContext = z.object({
  axiomVersion: z.string(),
  project: z.object({
    name: z.string(),
    tokenBudget: z.object({ hardLimitPerSlice: z.number().int().positive(), warnAt: z.number().int().positive() }),
  }),
  components: z.array(ComponentEntry).default([]),
  routes: z.array(RouteEntry).default([]),
  stores: z.array(StoreEntry).default([]),
  tokens: z.object({ file: z.string(), hash: z.string() }),
  integrity: z.object({
    lockedFiles: z.record(z.string(), z.string()),
    machineFiles: z.record(z.string(), z.string()),
  }),
  pipeline: z.object({
    lastRun: z
      .object({ id: z.string(), result: Status, failedStage: z.string().nullable() })
      .nullable()
      .default(null),
  }),
});

export type AgentContext = z.infer<typeof AgentContext>;

export const AgentContextJsonSchema = zodToJsonSchema(AgentContext, { name: "agent-context" });
```

- [ ] **Step 7: Baue und committe**

Run: `pnpm build`
Expected: keine TypeScript-Fehler.

```bash
git add package.json pnpm-lock.yaml src/cli/schemas/
git commit -m "feat(schemas): add Zod schemas for manifest, tokens, config, spec, fix-packet"
```

---

## Task 2: Hash-Hilfsmittel und Manifest-Reader/Writer

**Files:**
- Create: `src/cli/manifest/hash.ts`
- Create: `src/cli/manifest/reader.ts`
- Create: `src/cli/manifest/writer.ts`

- [ ] **Step 1: Erstelle `src/cli/manifest/hash.ts`**

```typescript
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function hashString(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export async function hashFile(path: string): Promise<string> {
  const content = await readFile(path);
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}
```

- [ ] **Step 2: Erstelle `src/cli/manifest/reader.ts`**

```typescript
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AgentContext } from "@/cli/schemas/agent-context.js";

export async function readAgentContext(cwd: string): Promise<AgentContext> {
  const path = resolve(cwd, "agent-context.json");
  const raw = await readFile(path, "utf-8");
  const parsed = JSON.parse(raw) as unknown;
  return AgentContext.parse(parsed);
}
```

- [ ] **Step 3: Erstelle `src/cli/manifest/writer.ts`**

```typescript
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export async function writeAgentContext(cwd: string, context: AgentContext): Promise<void> {
  const path = resolve(cwd, "agent-context.json");
  const content = `${JSON.stringify(context, null, 2)}\n`;
  await writeFile(path, content.replace(/\r\n/g, "\n"), "utf-8");
}
```

- [ ] **Step 4: Schreibe Unit-Tests**

Create `src/cli/manifest/reader.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";

const minimalContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:aa" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("manifest reader/writer", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-manifest-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("reads a valid agent-context.json", async () => {
    writeFileSync(join(baseDir, "agent-context.json"), JSON.stringify(minimalContext));
    const ctx = await readAgentContext(baseDir);
    expect(ctx.project.name).toBe("demo");
  });

  it("round-trips through writer and reader", async () => {
    await writeAgentContext(baseDir, minimalContext);
    const ctx = await readAgentContext(baseDir);
    expect(ctx).toEqual(minimalContext);
  });
});
```

- [ ] **Step 5: Baue und teste**

Run: `pnpm build && pnpm test`
Expected: Build grün, Unit-Tests grün.

- [ ] **Step 6: Commit**

```bash
git add src/cli/manifest/hash.ts src/cli/manifest/reader.ts src/cli/manifest/writer.ts src/cli/manifest/reader.test.ts
git commit -m "feat(manifest): add reader, writer and hash utilities"
```

---

## Task 3: Integrität und `axm validate`

**Files:**
- Create: `src/cli/manifest/integrity.ts`
- Create: `src/cli/commands/validate.ts`
- Modify: `src/cli/bin.ts`
- Create: `src/cli/manifest/integrity.test.ts`

- [ ] **Step 1: Erstelle `src/cli/manifest/integrity.ts`**

```typescript
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import { hashFile } from "@/cli/manifest/hash.js";

export interface IntegrityViolation {
  file: string;
  expected: string;
  actual: string | null;
}

export async function computeIntegrity(
  cwd: string,
  lockedFiles: string[],
  machineFiles: string[]
): Promise<{ locked: Record<string, string>; machine: Record<string, string> }> {
  const locked: Record<string, string> = {};
  const machine: Record<string, string> = {};

  for (const file of lockedFiles) {
    locked[file] = await hashFile(resolve(cwd, file));
  }
  for (const file of machineFiles) {
    machine[file] = await hashFile(resolve(cwd, file));
  }

  return { locked, machine };
}

export async function verifyIntegrity(
  cwd: string,
  context: AgentContext
): Promise<IntegrityViolation[]> {
  const violations: IntegrityViolation[] = [];
  const all = { ...context.integrity.lockedFiles, ...context.integrity.machineFiles };

  for (const [file, expected] of Object.entries(all)) {
    let actual: string | null = null;
    try {
      actual = await hashFile(resolve(cwd, file));
    } catch {
      actual = null;
    }
    if (actual !== expected) {
      violations.push({ file, expected, actual });
    }
  }

  return violations;
}
```

- [ ] **Step 2: Erstelle `src/cli/commands/validate.ts`**

```typescript
import { resolve } from "node:path";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { ExitCode } from "@/cli/types.js";
import { result, fail } from "@/cli/utils/ndjson.js";

export async function validate(cwd: string): Promise<void> {
  let context: Awaited<ReturnType<typeof readAgentContext>>;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Invalid agent-context.json: ${message}`, ExitCode.VALIDATION_ERROR);
  }

  const violations = await verifyIntegrity(cwd, context);
  if (violations.length > 0) {
    fail(
      `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`,
      ExitCode.OWNERSHIP_ERROR
    );
  }

  result({ ok: true, violations: [] });
}

export async function validateCommand(args: string[]): Promise<void> {
  const cwd = resolve(process.cwd(), args[0] ?? ".");
  await validate(cwd);
}
```

- [ ] **Step 3: Registriere `validate` in `src/cli/bin.ts`**

Füge nach dem `init`-Block hinzu:

```typescript
if (command === "validate") {
  await validateCommand(args);
  return ExitCode.OK;
}
```

Importiere oben: `import { validateCommand } from "@/cli/commands/validate.js";`

- [ ] **Step 4: Schreibe Integritäts-Tests**

Create `src/cli/manifest/integrity.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeIntegrity, verifyIntegrity } from "@/cli/manifest/integrity.js";
import { hashFile } from "@/cli/manifest/hash.js";

const baseContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:aa" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("integrity", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-integrity-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("computes hashes for listed files", async () => {
    writeFileSync(join(baseDir, "a.txt"), "hello");
    const { locked } = await computeIntegrity(baseDir, ["a.txt"], []);
    expect(locked["a.txt"]).toBe(await hashFile(join(baseDir, "a.txt")));
  });

  it("reports no violations when hashes match", async () => {
    writeFileSync(join(baseDir, "b.txt"), "world");
    const h = await hashFile(join(baseDir, "b.txt"));
    const context = { ...baseContext, integrity: { lockedFiles: { "b.txt": h }, machineFiles: {} } };
    const violations = await verifyIntegrity(baseDir, context);
    expect(violations).toHaveLength(0);
  });

  it("reports violations when hashes mismatch", async () => {
    writeFileSync(join(baseDir, "c.txt"), "changed");
    const context = { ...baseContext, integrity: { lockedFiles: { "c.txt": "sha256:old" }, machineFiles: {} } };
    const violations = await verifyIntegrity(baseDir, context);
    expect(violations).toHaveLength(1);
    expect(violations[0].file).toBe("c.txt");
  });
});
```

- [ ] **Step 5: Baue und teste**

Run: `pnpm build && pnpm test`
Expected: Build grün, Tests grün.

- [ ] **Step 6: Commit**

```bash
git add src/cli/manifest/integrity.ts src/cli/commands/validate.ts src/cli/bin.ts src/cli/manifest/integrity.test.ts
git commit -m "feat(manifest): add integrity verification and axm validate command"
```

---

## Task 4: `axm init` mit echten Hashes

**Files:**
- Modify: `src/cli/templates/manifest.ts`
- Modify: `src/cli/commands/init.ts`
- Modify: `src/cli/templates/app.ts`

- [ ] **Step 1: Aktualisiere `src/cli/templates/manifest.ts`**

`agentContextJson(name)` sollte ein valides `AgentContext`-Objekt zurückgeben (kein String mehr). Benenne die Funktion um oder passe sie an:

```typescript
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function initialAgentContext(name: string, tokenHash: string): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: {
      name,
      tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 },
    },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: tokenHash },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: null },
  };
}
```

- [ ] **Step 2: Aktualisiere `src/cli/commands/init.ts`**

Nach dem Schreiben aller Dateien:
1. Lese `tokens.json`-Inhalt und berechne Hash.
2. Berechne Hashes für LOCKED/MACHINE-Dateien (z. B. `src/core/*`, `src/generated/*`).
3. Schreibe `agent-context.json` mit `writeAgentContext`.

```typescript
import { mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";
import { execSync } from "node:child_process";
import { appFiles } from "@/cli/templates/app.js";
import { initialAgentContext } from "@/cli/templates/manifest.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { writeAgentContext } from "@/cli/manifest/writer.js";
import { hashFile, hashString } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import type { InitResult } from "@/cli/types.js";

export interface InitOptions {
  cwd?: string;
  skipInstall?: boolean;
}

const LOCKED_FILES = ["src/core/router.ts", "src/core/error-boundary.tsx", "src/core/token-provider.tsx"];
const MACHINE_FILES = ["src/generated/theme.css", ".cursorrules", "CLAUDE.md"];

export async function init(name: string, options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const targetDir = resolve(cwd, name);
  await mkdir(targetDir, { recursive: true });

  const projectName = basename(name);
  const created: string[] = [];
  for (const file of appFiles(projectName)) {
    const fullPath = resolve(targetDir, file.path);
    await writeTextFile(fullPath, file.content);
    created.push(file.path);
  }

  const tokenContent = await readFile(resolve(targetDir, "tokens.json"), "utf-8");
  const tokenHash = hashString(tokenContent);

  const context = initialAgentContext(projectName, tokenHash);
  for (const file of LOCKED_FILES) {
    context.integrity.lockedFiles[file] = await hashFile(resolve(targetDir, file));
  }
  for (const file of MACHINE_FILES) {
    context.integrity.machineFiles[file] = await hashFile(resolve(targetDir, file));
  }
  await writeAgentContext(targetDir, context);

  if (!options.skipInstall) {
    execSync("pnpm install --prefer-offline", { cwd: targetDir, stdio: "ignore" });
  }

  const output: InitResult = {
    ok: true,
    created,
    next: "axm add component <Name>",
  };
  result(output);
}
```

Füge `readFile` zu `node:fs/promises` hinzu.

- [ ] **Step 3: Aktualisiere `src/cli/templates/app.ts`**

`agentContextJson` wird nicht mehr als String-Template benötigt; entferne den alten Eintrag und verwende `initialAgentContext` aus `manifest.ts`.

- [ ] **Step 4: Baue und teste**

Run: `pnpm build && pnpm test`
Expected: grün.

Run: `node dist/cli/bin.js init m1-demo`
Verify: `m1-demo/agent-context.json` enthält `tokens.hash` ungleich `sha256:PLACEHOLDER` und `integrity.lockedFiles`/`integrity.machineFiles` mit echten Hashes.

- [ ] **Step 5: Commit**

```bash
git add src/cli/templates/manifest.ts src/cli/commands/init.ts src/cli/templates/app.ts
git commit -m "feat(init): write real hashes into agent-context.json"
```

---

## Task 5: Property-Tests für Manifest-Mutationen

**Files:**
- Create: `src/cli/schemas/agent-context.property.test.ts`

- [ ] **Step 1: Erstelle den Property-Test**

```typescript
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { AgentContext } from "@/cli/schemas/agent-context.js";

const statusArbitrary = fc.constantFrom("GREEN", "RED", "STALE", "ORPHAN");

const componentArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
  spec: fc.string({ minLength: 1, maxLength: 40 }),
  test: fc.string({ minLength: 1, maxLength: 40 }),
  exports: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
  dependsOn: fc.array(fc.string({ minLength: 1, maxLength: 40 }), { maxLength: 3 }),
  usedBy: fc.array(fc.string({ minLength: 1, maxLength: 40 }), { maxLength: 3 }),
  loc: fc.integer({ min: 0, max: 120 }),
  bytes: fc.integer({ min: 0, max: 4096 }),
  status: statusArbitrary,
  specHash: fc.string({ minLength: 10, maxLength: 70 }),
  lastPipelineRun: fc.option(fc.date().map((d) => d.toISOString()), { nil: undefined }),
});

const routeArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 20 }),
  component: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
});

const storeArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
  shapeHash: fc.string({ minLength: 10, maxLength: 70 }),
});

const contextArbitrary = fc.record({
  axiomVersion: fc.constant("1.0.0"),
  project: fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    tokenBudget: fc.record({
      hardLimitPerSlice: fc.integer({ min: 1000, max: 32000 }),
      warnAt: fc.integer({ min: 500, max: 16000 }),
    }),
  }),
  components: fc.array(componentArbitrary, { maxLength: 5 }),
  routes: fc.array(routeArbitrary, { maxLength: 5 }),
  stores: fc.array(storeArbitrary, { maxLength: 3 }),
  tokens: fc.record({
    file: fc.constant("tokens.json"),
    hash: fc.string({ minLength: 10, maxLength: 70 }),
  }),
  integrity: fc.record({
    lockedFiles: fc.dictionary(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 10, maxLength: 70 })),
    machineFiles: fc.dictionary(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 10, maxLength: 70 })),
  }),
  pipeline: fc.record({
    lastRun: fc.option(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        result: statusArbitrary,
        failedStage: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
      }),
      { nil: null }
    ),
  }),
});

describe("AgentContext schema property tests", () => {
  it("accepts 1.000 random valid manifest mutations", () => {
    fc.assert(
      fc.property(contextArbitrary, (raw) => {
        const parsed = AgentContext.safeParse(raw);
        expect(parsed.success).toBe(true);
      }),
      { numRuns: 1000 }
    );
  });
});
```

- [ ] **Step 2: Baue und teste**

Run: `pnpm test`
Expected: Alle Tests grün, Property-Test 1.000 Durchläufe erfolgreich.

- [ ] **Step 3: Commit**

```bash
git add src/cli/schemas/agent-context.property.test.ts
git commit -m "test(schemas): add property test for agent-context.json mutations"
```

---

## Task 6: Finishing M1

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Finale Verifizierung**

Run:
```bash
pnpm build
pnpm test
pnpm run test:integration
node dist/cli/bin.js init m1-final-demo
node dist/cli/bin.js validate m1-final-demo
```

Expected:
- `pnpm build` grün
- `pnpm test` grün
- `pnpm run test:integration` grün
- `m1-final-demo/agent-context.json` hat echte Hashes
- `axm validate m1-final-demo` exit 0

- [ ] **Step 2: Aktualisiere `AGENTS.md`**

Ergänze: M1 implementiert; `axm validate` funktioniert; Schemas existieren.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md for M1 completion"
```

---

## Spec Coverage

| Spezifikations-Abschnitt | Abgedeckt durch |
|---|---|
| §4.1 `agent-context.json` | `src/cli/schemas/agent-context.ts` + Reader/Writer |
| §4.2 Komponenten-Sidecar | `src/cli/schemas/component-spec.ts` |
| §4.3 `tokens.json` | `src/cli/schemas/tokens.ts` |
| §4.4 `axiom.config.json` | `src/cli/schemas/config.ts` |
| §5 `axm validate` | `src/cli/commands/validate.ts` |
| §7.2 FIX_PACKET-Schema | `src/cli/schemas/fix-packet.ts` |
| §10 M1 Abnahme | Property-Test 1.000 Mutationen |

---

## Placeholder Scan

- Keine `TBD`, `TODO`, `implement later`, `fill in details`.
- Jeder Code-Step enthält vollständigen Code.
- Jeder Test-Step enthält vollständigen Test-Code.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-08-axiom-m1-manifest-core.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
