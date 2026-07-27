# Phase 0 — M4 Pipeline + Heal stabilisieren

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Frischer Subagent pro Task + Spec-Review + Code-Quality-Review.

**Goal:** `pnpm run test:integration` wird grün; `pnpm test` und `pnpm build` bleiben grün.

**Architecture:** Die bestehenden Stages und Commands bleiben erhalten; wir fixen Race-Conditions, Parser-Robustheit und Test-Isolation, damit die v1.0-Abnahmekriterien für M4 erfüllt sind.

**Ausgangszustand:** 18 Integrationstests fehlschlagen (Stand Audit 2026-07-09):
- `validate.integration.test.ts`: V002 STACK_TRACE_ERROR; V001/V004/V006/V008/V009/V012 liefern Exit 50 statt 10
- `pipeline.integration.test.ts`: V001/V004/V006/V008/V009 und AXM-U001 liefern Exit 50 statt 0
- `heal.integration.test.ts`: 3/3 Tests fehlschlagen (Ack-Timeout, falsche Zieldatei `eslint.config.js`, kein `CliError` bei Eskalation)
- `init.test.ts`: deterministischer Hash-Test instabil
- Integration-Config inkludiert doppelte `dist/` Plugin-Tests

---

## Task 1: ESLint `process.chdir` Race-Condition eliminieren

**Files:**
- Modify: `src/cli/validate/lint.ts`
- Test: `src/cli/commands/validate.integration.test.ts` (Vollausführung aller validate-Fixtures)

**Problem:** `runEslintChecks` wechselt `process.chdir(cwd)`. Weil `eslint.lintFiles` async ist, können sich parallel laufende Integrationstests gegenseitig das cwd kaputt setzen.

**Lösung:** `process.chdir` entfernen; ESLint bekommt `cwd` weiterhin im Konstruktor. Falls Plugin-Auflösung Probleme macht, `resolvePluginsRelativeTo: cwd` ergänzen.

- [ ] **Step 1: Test isoliert laufen lassen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/validate.integration.test.ts --reporter=verbose`
Expected: aktuell grün (verifizieren)

- [ ] **Step 2: Test im vollen Suite-Kontext laufen lassen**

Run: `pnpm run test:integration`
Expected: validate-Fixtures rot (V002 STACK_TRACE, V001/V004… Exit 50)

- [ ] **Step 3: `process.chdir` entfernen**

```ts
export async function runEslintChecks(cwd: string, files: string[]): Promise<FixPacket | null> {
  if (files.length === 0) return null;
  const configPath = resolve(cwd, "eslint.config.js");
  try {
    await access(configPath);
  } catch {
    return null;
  }
  const eslint = new ESLint({ cwd, resolvePluginsRelativeTo: cwd });
  const results = await eslint.lintFiles(files);
  // ... restliche Logik unverändert ...
}
```

- [ ] **Step 4: Test wiederholen**

Run: `pnpm run test:integration`
Expected: validate-Fixtures grün

- [ ] **Step 5: Commit**

```bash
git add src/cli/validate/lint.ts
git commit -m "fix(validate): remove process.chdir race in ESLint checks"
```

---

## Task 2: Non-ESLint Invarianten-Checks in `validate` ergänzen

**Files:**
- Modify: `src/cli/validate/checks.ts`
- Modify: `src/cli/commands/validate.ts`
- Test: `src/cli/commands/pipeline.integration.test.ts` (V001/V004/V006/V008/V009)

**Problem:** Pipeline-Fixtures laufen in uninstalled Apps; ESLint crasht wegen fehlender `node_modules`.

**Lösung:** Schnelle Regex/Line-Count-Checks in `checks.ts` implementieren, die vor `runEslintChecks` laufen.

- [ ] **Step 1: Failing test bestätigen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/pipeline.integration.test.ts -t "AXM-V001" --reporter=verbose`
Expected: FAIL Exit 50

- [ ] **Step 2: Hilfsfunktionen in `checks.ts` ergänzen**

```ts
function countCodeLines(content: string): number {
  return content
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== "" && !trimmed.startsWith("//");
    }).length;
}

function checkFileContent(
  cwd: string,
  context: AgentContext,
  predicate: (content: string, file: string) => { ok: boolean; line?: number; message?: string }
): { file: string; line?: number; message: string } | null {
  for (const component of context.components) {
    const content = readFileSync(resolve(cwd, component.file), "utf-8");
    const result = predicate(content, component.file);
    if (!result.ok) {
      return { file: component.file, line: result.line, message: result.message ?? "invariant violation" };
    }
  }
  return null;
}
```

- [ ] **Step 3: Einzelne Checks implementieren**

```ts
export async function checkLocLimit(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  const violation = checkFileContent(cwd, context, (content) => {
    const lines = countCodeLines(content);
    return lines > 120 ? { ok: false, message: `${lines} code lines (max 120)` } : { ok: true };
  });
  if (violation === null) return null;
  return buildFixPacket(
    "AXM-V001",
    violation.message,
    violation.file,
    ["I-01"],
    "Split the file using 'axm split' or extract helpers.",
    "Component file exceeds the maximum allowed lines of code.",
    violation.line ?? 1,
    1
  );
}

export async function checkDefaultExport(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  const violation = checkFileContent(cwd, context, (content) => {
    const match = content.match(/export\s+default\s+/);
    return match === null ? { ok: true } : { ok: false, line: content.slice(0, match.index).split("\n").length };
  });
  // ... analog buildFixPacket AXM-V004, I-04 ...
}

export async function checkBarrelFile(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  // AXM-V005: export ... from ...
}

export async function checkRelativeImport(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  // AXM-V006: from "./..."
}

export async function checkRawValues(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  // AXM-V008: #rrggbb oder \d+px
}

export async function checkEscapeHatches(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  // AXM-V009: @ts-ignore, eslint-disable, : any
}

export async function checkDynamicImports(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  // AXM-V012: import(variable)
}
```

- [ ] **Step 4: Checks in `validate.ts` einhängen**

```ts
const checks = [
  () => checkLocLimit(cwd, context),
  () => checkByteCap(cwd, context),
  () => checkDefaultExport(cwd, context),
  () => checkSingleExport(cwd, context),
  () => checkBarrelFile(cwd, context),
  () => checkRelativeImport(cwd, context),
  () => checkSidecar(cwd, context),
  () => checkRawValues(cwd, context),
  () => checkEscapeHatches(cwd, context),
  () => checkDynamicImports(cwd, context),
  () => Promise.resolve(checkOwnership(cwd, context)),
  () => checkIntegrity(cwd, context),
  () => runEslintChecks(cwd, files),
];
```

- [ ] **Step 5: Pipeline-Fixtures erneut laufen lassen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/pipeline.integration.test.ts --reporter=verbose`
Expected: V001/V004/V006/V008/V009 grün

- [ ] **Step 6: Commit**

```bash
git add src/cli/validate/checks.ts src/cli/commands/validate.ts
git commit -m "feat(validate): add non-ESLint invariant checks for uninstalled apps"
```

---

## Task 3: Lint-Stage filtert Config-Dateien als Ziel

**Files:**
- Modify: `src/cli/pipeline/stages/lint.ts`
- Test: `src/cli/commands/heal.integration.test.ts`

**Problem:** `runLintStage` nimmt die erste ESLint-Meldung aus allen Dateien; bei Problemen mit `eslint.config.js` wird diese als Ziel geliefert, statt der Komponente.

**Lösung:** Meldungen aus Config-Dateien ausschließen und bevorzugt Dateien unter `src/` wählen.

- [ ] **Step 1: Heal-Test bestätigen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/heal.integration.test.ts -t "heals after ack and fix" --reporter=verbose`
Expected: FAIL Target file eslint.config.js

- [ ] **Step 2: Ziel-Logik anpassen**

```ts
const CONFIG_FILES = new Set(["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "vite.config.ts"]);

function isConfigFile(file: string): boolean {
  return CONFIG_FILES.has(file) || file.startsWith("packages/");
}

export async function runLintStage(cwd: string): Promise<StageResult> {
  try {
    execSync("pnpm eslint . --format json", { cwd, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const stdout = String((error as { stdout?: Buffer }).stdout ?? "[]");
    const results = JSON.parse(stdout) as EslintResult[];
    const candidate = results
      .filter((r) => r.messages.length > 0)
      .sort((a, b) => {
        const aSrc = relative(cwd, a.filePath).replace(/\\/g, "/").startsWith("src/") ? 0 : 1;
        const bSrc = relative(cwd, b.filePath).replace(/\\/g, "/").startsWith("src/") ? 0 : 1;
        return aSrc - bSrc;
      })
      .find((r) => !isConfigFile(relative(cwd, r.filePath).replace(/\\/g, "/")));
    const firstResult = candidate ?? results.find((r) => r.messages.length > 0);
    // ... restliche Logik ...
  }
}
```

- [ ] **Step 3: Heal-Test wiederholen**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/heal.integration.test.ts --reporter=verbose`
Expected: "heals after ack and fix" grün

- [ ] **Step 4: Commit**

```bash
git add src/cli/pipeline/stages/lint.ts
git commit -m "fix(pipeline/lint): prefer src/ files over config files as packet target"
```

---

## Task 4: Unit-Stage parsed JSON robust

**Files:**
- Modify: `src/cli/pipeline/stages/unit.ts`
- Test: `src/cli/commands/pipeline.integration.test.ts -t "AXM-U001"`

**Problem:** Vitest schreibt möglicherweise zusätzliche Ausgaben vor dem JSON-Report; reines `JSON.parse(stdout)` crasht.

**Lösung:** Letztes JSON-Objekt aus stdout extrahieren.

- [ ] **Step 1: Parser robust machen**

```ts
function extractLastJson(stdout: string): VitestReport {
  const lines = stdout.trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]!.trim();
    if (line.startsWith("{") || line.startsWith("[")) {
      try {
        return JSON.parse(line) as VitestReport;
      } catch {
        // continue scanning
      }
    }
  }
  return {};
}
```

- [ ] **Step 2: In `runUnitStage` verwenden**

```ts
const report = extractLastJson(stdout);
```

- [ ] **Step 3: Test**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/pipeline.integration.test.ts -t "AXM-U001" --reporter=verbose`
Expected: grün

- [ ] **Step 4: Commit**

```bash
git add src/cli/pipeline/stages/unit.ts
git commit -m "fix(pipeline/unit): robustly extract last JSON object from vitest stdout"
```

---

## Task 5: `healCommand` wirft `CliError` bei unverändertem Target

**Files:**
- Modify: `src/cli/commands/heal.ts`
- Test: `src/cli/commands/heal.integration.test.ts -t "escalates unfixable error"`

**Problem:** Bei `hashBefore === hashAfter` wird ein generischer `Error` geworfen; Test erwartet `CliError` mit Exit 50.

**Lösung:** `CliError` mit `AXM-I001` werfen.

- [ ] **Step 1: Code ändern**

```ts
if (hashBefore === hashAfter) {
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-I001", `Target file ${packet.target.file} did not change after ack`, ["I-11"])),
    ExitCode.INTERNAL_ERROR
  );
}
```

- [ ] **Step 2: Test**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/heal.integration.test.ts -t "escalates unfixable error" --reporter=verbose`
Expected: grün

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/heal.ts
git commit -m "fix(heal): throw CliError when target file does not change after ack"
```

---

## Task 6: `AXM-V011` referenziert `I-11` statt `I-10`

**Files:**
- Modify: `src/cli/validate/checks.ts:97`

- [ ] **Step 1: String ändern**

```ts
invariantsAffected: ["I-11"],
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/validate/checks.ts
git commit -m "fix(validate): AXM-V011 references I-11 (hash integrity)"
```

---

## Task 7: `init.test.ts` Determinismus stabilisieren

**Files:**
- Modify: `src/cli/commands/init.test.ts`

**Problem:** `snapshotDir` inkludiert `packages/eslint-plugin-axiom/dist/`, das Build-Artefakte mit Timestamps enthalten kann.

**Lösung:** `dist/`-Verzeichnisse vom Snapshot ausschließen.

- [ ] **Step 1: Filter ergänzen**

```ts
.filter((f) => !f.startsWith("node_modules/") && !f.includes("/dist/") && f !== "pnpm-lock.yaml")
```

- [ ] **Step 2: Test**

Run: `pnpm vitest run -c vitest.integration.config.ts src/cli/commands/init.test.ts -t "is deterministic across runs" --reporter=verbose`
Expected: grün

- [ ] **Step 3: Commit**

```bash
git add src/cli/commands/init.test.ts
git commit -m "test(init): exclude dist/ from determinism snapshot"
```

---

## Task 8: Integration-Config exkludiert doppelte Plugin-Tests

**Files:**
- Modify: `vitest.integration.config.ts`

**Problem:** `packages/**` wird nicht ausgeschlossen; Source-Tests und `dist/` Tests des Plugins laufen doppelt.

**Lösung:** `packages/**` zur Exclude-Liste hinzufügen.

- [ ] **Step 1: Config ändern**

```ts
exclude: ["node_modules/**", "dist/**", "test-app/**", "packages/**"],
```

- [ ] **Step 2: Commit**

```bash
git add vitest.integration.config.ts
git commit -m "chore(vitest): exclude packages/** from integration tests"
```

---

## Task 9: Finale Verifikation

**Files:** alle obigen

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: exit 0

- [ ] **Step 2: Unit-Tests**

Run: `pnpm test`
Expected: alle grün

- [ ] **Step 3: Plugin-Tests**

Run: `pnpm --filter eslint-plugin-axiom test`
Expected: alle grün

- [ ] **Step 4: Integrationstests**

Run: `pnpm run test:integration`
Expected: 0 failures

- [ ] **Step 5: Commit falls Änderungen übrig**

```bash
git status # prüfen
git commit -m "test(m4): integration suite green after phase 0 fixes" || true
```

---

## Spec-Coverage-Check

| v1.0 / v2.0 Requirement | Task |
|---|---|
| I-01…I-12 erzwungen | Task 2 |
| Pipeline State Machine RED → FIX_PACKET | Task 2, 3, 4 |
| `axm heal --auto` Retry + Eskalation | Task 3, 5 |
| Kein `process.chdir` Race | Task 1 |
| Deterministisches `axm init` | Task 7 |
| Keine doppelten Tests | Task 8 |

## Placeholder-Scan

Keine TBD/TODO/FIXME. Jeder Task enthält konkrete Dateipfade, Code-Snippets und Befehle.
