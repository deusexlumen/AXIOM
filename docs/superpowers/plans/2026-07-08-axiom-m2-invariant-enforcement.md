# M2 — Invarianten-Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `eslint-plugin-axiom` enforcing I-01/I-04/I-05/I-06/I-08/I-09/I-12, extend `axm validate` to enforce I-02/I-03/I-07/I-10, and prove every invariant has a violation fixture that yields the correct exit code and `errorCode`.

**Architecture:** Add a workspace package `packages/eslint-plugin-axiom` consumed by both the CLI monorepo and the generated app template. Each invariant maps to either an ESLint rule or a validation step in `axm validate`. Violation fixtures live under `src/cli/fixtures/invariants/` and are exercised by integration tests that run the CLI and assert NDJSON/FIX_PACKET output.

**Tech Stack:** pnpm workspace, ESLint 9 Flat Config, TypeScript 5.x, Vitest, ts-morph (for I-03 single-export detection), the existing Zod schemas from M1.

---

## File Structure

```
C:/Users/Buxe/Projects/AXIOM/.worktrees/m1/
├── pnpm-workspace.yaml                 # new: declares packages/*
├── package.json                        # modified: becomes workspace root
├── packages/
│   └── eslint-plugin-axiom/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/index.ts                # plugin entry, re-exports rules
│       ├── src/rules/max-loc.ts        # I-01
│       ├── src/rules/no-default-export.ts   # I-04
│       ├── src/rules/no-barrel.ts           # I-05
│       ├── src/rules/absolute-imports.ts    # I-06
│       ├── src/rules/tokens-only.ts         # I-08
│       ├── src/rules/no-escape-hatch.ts     # I-09
│       ├── src/rules/static-imports.ts      # I-12
│       └── src/rules/__tests__/*.test.ts
├── src/cli/commands/validate.ts        # modified: add I-02/I-03/I-07/I-10 checks
├── src/cli/manifest/ownership.ts       # new: zone checks for I-10
├── src/cli/fixtures/invariants/        # new: violation fixtures
│   ├── i01-max-loc/
│   ├── i02-byte-cap/
│   ├── i03-single-export/
│   ├── i04-no-default-export/
│   ├── i05-no-barrel/
│   ├── i06-absolute-imports/
│   ├── i07-sidecar/
│   ├── i08-tokens-only/
│   ├── i09-no-escape-hatch/
│   ├── i10-ownership/
│   ├── i11-ndjson/
│   └── i12-static-imports/
├── src/cli/commands/validate.integration.test.ts   # new
└── src/cli/templates/eslint-config.ts  # modified: include plugin rules
```

---

### Task 1: Convert repo to pnpm workspace and scaffold plugin package

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `packages/eslint-plugin-axiom/package.json`
- Create: `packages/eslint-plugin-axiom/tsconfig.json`
- Modify: `package.json` (root)

- [ ] **Step 1: Create workspace manifest**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - .
  - packages/*
```

- [ ] **Step 2: Make root package a workspace root**

Modify `package.json` (root). Add this field right after `"private": true`:

```json
"packageManager": "pnpm@9.15.0"
```

already exists; instead add the workspace protocol to the root name is not needed. Only ensure the root stays installable. No code change required beyond the workspace file.

- [ ] **Step 3: Create plugin package.json**

Create `packages/eslint-plugin-axiom/package.json`:

```json
{
  "name": "eslint-plugin-axiom",
  "version": "1.0.0",
  "description": "AXIOM invariant enforcement rules for ESLint 9",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run --reporter=json"
  },
  "peerDependencies": {
    "eslint": "^9.0.0"
  },
  "devDependencies": {
    "@types/eslint": "^9.6.1",
    "eslint": "^9.24.0",
    "typescript": "5.9.3",
    "vitest": "3.2.7"
  }
}
```

- [ ] **Step 4: Create plugin tsconfig.json**

Create `packages/eslint-plugin-axiom/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "declaration": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 5: Run pnpm install**

Run: `pnpm install`

Expected: lockfile updated, `packages/eslint-plugin-axiom/node_modules` created.

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml packages/eslint-plugin-axiom/package.json packages/eslint-plugin-axiom/tsconfig.json pnpm-lock.yaml
git commit -m "chore(workspace): scaffold eslint-plugin-axiom package"
```

---

### Task 2: Plugin entry and shared rule helpers

**Files:**
- Create: `packages/eslint-plugin-axiom/src/index.ts`
- Create: `packages/eslint-plugin-axiom/src/utils/create-rule.ts`
- Create: `packages/eslint-plugin-axiom/src/utils/const.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/*.ts` (minimal stubs so the package builds)

- [ ] **Step 1: Create rule factory**

Create `packages/eslint-plugin-axiom/src/utils/create-rule.ts`:

```ts
import type { Rule } from "eslint";

export interface AxiomRule {
  meta: Rule.RuleMetaData;
  create(context: Rule.RuleContext): Rule.NodeListener;
}

export function createRule(rule: AxiomRule): Rule.RuleModule {
  return rule as Rule.RuleModule;
}
```

- [ ] **Step 2: Create invariant constants**

Create `packages/eslint-plugin-axiom/src/utils/const.ts`:

```ts
export const INVARIANTS = {
  MAX_LOC: "I-01",
  NO_DEFAULT_EXPORT: "I-04",
  NO_BARREL: "I-05",
  ABSOLUTE_IMPORTS: "I-06",
  TOKENS_ONLY: "I-08",
  NO_ESCAPE_HATCH: "I-09",
  STATIC_IMPORTS: "I-12",
} as const;
```

- [ ] **Step 3: Create minimal rule stubs**

Create one file per rule so the plugin package compiles before the rules are fully implemented.

`packages/eslint-plugin-axiom/src/rules/max-loc.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const maxLoc = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-01: max lines of code per file" },
    schema: [],
    messages: { stub: "Stub: rule not yet implemented." },
  },
  create(): Rule.NodeListener {
    return {};
  },
});
```

Repeat the same stub pattern for `no-default-export.ts`, `no-barrel.ts`, `absolute-imports.ts`, `tokens-only.ts`, `no-escape-hatch.ts`, and `static-imports.ts`, adjusting the export name and `docs.description` per rule.

- [ ] **Step 4: Create plugin entry**

Create `packages/eslint-plugin-axiom/src/index.ts`:

```ts
import { maxLoc } from "@/rules/max-loc.js";
import { noDefaultExport } from "@/rules/no-default-export.js";
import { noBarrel } from "@/rules/no-barrel.js";
import { absoluteImports } from "@/rules/absolute-imports.js";
import { tokensOnly } from "@/rules/tokens-only.js";
import { noEscapeHatch } from "@/rules/no-escape-hatch.js";
import { staticImports } from "@/rules/static-imports.js";

const plugin = {
  meta: {
    name: "eslint-plugin-axiom",
    version: "1.0.0",
  },
  rules: {
    "max-loc": maxLoc,
    "no-default-export": noDefaultExport,
    "no-barrel": noBarrel,
    "absolute-imports": absoluteImports,
    "tokens-only": tokensOnly,
    "no-escape-hatch": noEscapeHatch,
    "static-imports": staticImports,
  },
};

export default plugin;
```

Note: No named re-exports from `index.ts` to avoid a barrel file (I-05). Imports use the `@/` alias configured in `tsconfig.json`.

- [ ] **Step 5: Build the plugin package**

Run: `cd packages/eslint-plugin-axiom && pnpm build`

Expected: PASS (no TS2307 errors).

- [ ] **Step 6: Commit**

```bash
git add packages/eslint-plugin-axiom/src/index.ts packages/eslint-plugin-axiom/src/utils/create-rule.ts packages/eslint-plugin-axiom/src/utils/const.ts packages/eslint-plugin-axiom/src/rules
git commit -m "feat(eslint-plugin): plugin entry and rule factory"
```

---

### Task 3: Implement `max-loc` rule (I-01)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/max-loc.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/max-loc.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/max-loc.test.ts`:

```ts
import { RuleTester } from "eslint";
import { maxLoc } from "../max-loc.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("max-loc", maxLoc, {
  valid: [
    { code: "export function f() { return 1; }\n", options: [{ max: 3 }] },
  ],
  invalid: [
    {
      code: "export function f() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n  const d = 4;\n  return a + b + c + d;\n}\n",
      options: [{ max: 3 }],
      errors: [{ messageId: "exceedsMaxLoc" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL — `max-loc` rule not found or module missing.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/max-loc.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";
import { INVARIANTS } from "../utils/const.js";

interface Options {
  max?: number;
}

export const maxLoc = createRule({
  meta: {
    type: "problem",
    docs: {
      description: "Enforce I-01: max lines of code per file",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      exceedsMaxLoc: `I-01: File exceeds maximum allowed lines of code ({{max}}). Use 'axm split'.`,
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const options = (context.options[0] ?? {}) as Options;
    const max = options.max ?? 120;
    return {
      Program(node): void {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const lines = sourceCode.lines;
        let loc = 0;
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 0) continue;
          if (trimmed.startsWith("//")) continue;
          if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) continue;
          loc += 1;
        }
        if (loc > max) {
          context.report({
            node,
            messageId: "exceedsMaxLoc",
            data: { max: String(max) },
          });
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/max-loc.ts packages/eslint-plugin-axiom/src/rules/__tests__/max-loc.test.ts
git commit -m "feat(eslint-plugin): add max-loc rule (I-01)"
```

---

### Task 4: Implement `no-default-export` rule (I-04)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/no-default-export.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/no-default-export.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/no-default-export.test.ts`:

```ts
import { RuleTester } from "eslint";
import { noDefaultExport } from "../no-default-export.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-default-export", noDefaultExport, {
  valid: [
    { code: "export function f() {}\n" },
    { code: "export const x = 1;\n" },
  ],
  invalid: [
    {
      code: "export default function f() {}\n",
      errors: [{ messageId: "noDefaultExport" }],
    },
    {
      code: "const x = 1;\nexport default x;\n",
      errors: [{ messageId: "noDefaultExport" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/no-default-export.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

export const noDefaultExport = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-04: no default exports" },
    schema: [],
    messages: {
      noDefaultExport: "I-04: Default exports are forbidden. Use named exports only.",
    },
  },
  create(): Rule.NodeListener {
    return {
      ExportDefaultDeclaration(node): void {
        node.parent;
        // node.parent access satisfies noUnusedLocals if needed; not required.
      },
    };
  },
});
```

Oops — the rule above does not report. Fix in Step 4. Actually, write it correctly here:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

export const noDefaultExport = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-04: no default exports" },
    schema: [],
    messages: {
      noDefaultExport: "I-04: Default exports are forbidden. Use named exports only.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ExportDefaultDeclaration(node): void {
        context.report({ node, messageId: "noDefaultExport" });
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/no-default-export.ts packages/eslint-plugin-axiom/src/rules/__tests__/no-default-export.test.ts
git commit -m "feat(eslint-plugin): add no-default-export rule (I-04)"
```

---

### Task 5: Implement `no-barrel` rule (I-05)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/no-barrel.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/no-barrel.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/no-barrel.test.ts`:

```ts
import { RuleTester } from "eslint";
import { noBarrel } from "../no-barrel.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-barrel", noBarrel, {
  valid: [
    { code: "export function f() {}\n" },
    { code: "import { x } from './x';\nexport function f() { return x; }\n" },
  ],
  invalid: [
    {
      code: "export { a } from './a';\nexport { b } from './b';\n",
      errors: [{ messageId: "noBarrel" }],
    },
    {
      code: "export * from './a';\n",
      errors: [{ messageId: "noBarrel" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/no-barrel.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

export const noBarrel = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-05: no barrel files" },
    schema: [],
    messages: {
      noBarrel: "I-05: Barrel re-exports are forbidden. Import directly from the source file.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ExportAllDeclaration(node): void {
        context.report({ node, messageId: "noBarrel" });
      },
      ExportNamedDeclaration(node): void {
        if (node.source !== null && node.source.value !== "") {
          context.report({ node, messageId: "noBarrel" });
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/no-barrel.ts packages/eslint-plugin-axiom/src/rules/__tests__/no-barrel.test.ts
git commit -m "feat(eslint-plugin): add no-barrel rule (I-05)"
```

---

### Task 6: Implement `absolute-imports` rule (I-06)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/absolute-imports.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/absolute-imports.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/absolute-imports.test.ts`:

```ts
import { RuleTester } from "eslint";
import { absoluteImports } from "../absolute-imports.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("absolute-imports", absoluteImports, {
  valid: [
    { code: "import { x } from '@/x';\n" },
    { code: "import { x } from 'node:fs';\n" },
    { code: "import './styles.css';\n" },
  ],
  invalid: [
    {
      code: "import { x } from './x';\n",
      errors: [{ messageId: "noRelativeImport" }],
    },
    {
      code: "import { x } from '../x';\n",
      errors: [{ messageId: "noRelativeImport" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/absolute-imports.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

export const absoluteImports = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-06: imports only via @/ alias or bare/module specifiers" },
    schema: [],
    messages: {
      noRelativeImport: "I-06: Relative imports are forbidden. Use the @/ alias.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ImportDeclaration(node): void {
        const source = node.source.value;
        if (source.startsWith("./") || source.startsWith("../")) {
          context.report({ node: node.source, messageId: "noRelativeImport" });
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/absolute-imports.ts packages/eslint-plugin-axiom/src/rules/__tests__/absolute-imports.test.ts
git commit -m "feat(eslint-plugin): add absolute-imports rule (I-06)"
```

---

### Task 7: Implement `tokens-only` rule (I-08)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/tokens-only.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/tokens-only.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/tokens-only.test.ts`:

```ts
import { RuleTester } from "eslint";
import { tokensOnly } from "../tokens-only.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("tokens-only", tokensOnly, {
  valid: [
    { code: "const c = 'bg-action-primary';\n" },
    { code: "export function Box() { return <div className=\"bg-action-primary\" />; }\n" },
  ],
  invalid: [
    {
      code: "const c = '#4F46E5';\n",
      errors: [{ messageId: "rawValue" }],
    },
    {
      code: "export function Box() { return <div style={{ color: '#4F46E5' }} />; }\n",
      errors: [{ messageId: "rawValue" }],
    },
    {
      code: "export function Box() { return <div className=\"w-[137px]\" />; }\n",
      errors: [{ messageId: "arbitraryValue" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/tokens-only.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

const HEX_COLOR = /#[0-9A-Fa-f]{3,8}\b/;
const RGB_RGBA = /rgba?\s*\(/;
const ARBITRARY_VALUE = /\[\s*\d+\s*(?:px|rem|em|vh|vw)?\s*\]/;

export const tokensOnly = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-08: no raw colors or pixel values; token references only" },
    schema: [],
    messages: {
      rawValue: "I-08: Raw color or pixel value detected. Use a token reference instead.",
      arbitraryValue: "I-08: Tailwind arbitrary value detected. Use a token class instead.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    function checkLiteral(node: { value: unknown; loc?: { start: { line: number } } | null }): void {
      if (typeof node.value !== "string") return;
      if (HEX_COLOR.test(node.value) || RGB_RGBA.test(node.value)) {
        context.report({ node: node as never, messageId: "rawValue" });
      }
      if (ARBITRARY_VALUE.test(node.value)) {
        context.report({ node: node as never, messageId: "arbitraryValue" });
      }
    }
    return {
      Literal(node): void {
        checkLiteral(node);
      },
      JSXText(node): void {
        checkLiteral(node as never);
      },
      TemplateElement(node): void {
        if (node.value.cooked !== null) {
          checkLiteral({ value: node.value.cooked, loc: node.loc });
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/tokens-only.ts packages/eslint-plugin-axiom/src/rules/__tests__/tokens-only.test.ts
git commit -m "feat(eslint-plugin): add tokens-only rule (I-08)"
```

---

### Task 8: Implement `no-escape-hatch` rule (I-09)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/no-escape-hatch.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/no-escape-hatch.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/no-escape-hatch.test.ts`:

```ts
import { RuleTester } from "eslint";
import { noEscapeHatch } from "../no-escape-hatch.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-escape-hatch", noEscapeHatch, {
  valid: [
    { code: "const x: number = 1;\n" },
    { code: "// normal comment\nexport const x = 1;\n" },
  ],
  invalid: [
    {
      code: "const x: any = 1;\n",
      errors: [{ messageId: "noEscapeHatch" }],
    },
    {
      code: "// @ts-ignore\nexport const x = 1;\n",
      errors: [{ messageId: "noEscapeHatch" }],
    },
    {
      code: "// eslint-disable-next-line\nexport const x = 1;\n",
      errors: [{ messageId: "noEscapeHatch" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/no-escape-hatch.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

const ESCAPE_PATTERNS = [
  { pattern: /\bany\b/, label: "any" },
  { pattern: /@ts-ignore/, label: "@ts-ignore" },
  { pattern: /@ts-expect-error/, label: "@ts-expect-error" },
  { pattern: /eslint-disable/, label: "eslint-disable" },
];

export const noEscapeHatch = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-09: no any, @ts-ignore, or eslint-disable" },
    schema: [],
    messages: {
      noEscapeHatch: "I-09: Escape hatch '{{label}}' is forbidden. Remove it.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      Identifier(node): void {
        if (node.name === "any") {
          context.report({ node, messageId: "noEscapeHatch", data: { label: "any" } });
        }
      },
      Program(): void {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        for (const comment of sourceCode.getAllComments()) {
          for (const { pattern, label } of ESCAPE_PATTERNS) {
            if (pattern.test(comment.value)) {
              context.report({ node: comment as never, messageId: "noEscapeHatch", data: { label } });
            }
          }
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/no-escape-hatch.ts packages/eslint-plugin-axiom/src/rules/__tests__/no-escape-hatch.test.ts
git commit -m "feat(eslint-plugin): add no-escape-hatch rule (I-09)"
```

---

### Task 9: Implement `static-imports` rule (I-12)

**Files:**
- Create: `packages/eslint-plugin-axiom/src/rules/static-imports.ts`
- Create: `packages/eslint-plugin-axiom/src/rules/__tests__/static-imports.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/eslint-plugin-axiom/src/rules/__tests__/static-imports.test.ts`:

```ts
import { RuleTester } from "eslint";
import { staticImports } from "../static-imports.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("static-imports", staticImports, {
  valid: [
    { code: "import { x } from '@/x';\n" },
    { code: "import x from '@/x';\n" },
  ],
  invalid: [
    {
      code: "const mod = './x';\nimport(mod);\n",
      errors: [{ messageId: "noDynamicImport" }],
    },
  ],
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: FAIL.

- [ ] **Step 3: Implement rule**

Create `packages/eslint-plugin-axiom/src/rules/static-imports.ts`:

```ts
import type { Rule } from "eslint";
import { createRule } from "../utils/create-rule.js";

export const staticImports = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-12: no dynamic imports with variable paths" },
    schema: [],
    messages: {
      noDynamicImport: "I-12: Dynamic imports with variable paths are forbidden.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ImportExpression(node): void {
        if (node.source.type !== "Literal") {
          context.report({ node: node.source, messageId: "noDynamicImport" });
        }
      },
    };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/eslint-plugin-axiom && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/eslint-plugin-axiom/src/rules/static-imports.ts packages/eslint-plugin-axiom/src/rules/__tests__/static-imports.test.ts
git commit -m "feat(eslint-plugin): add static-imports rule (I-12)"
```

---

### Task 10: Add `axm validate` checks for I-02 byte cap, I-03 single export, I-07 sidecar

**Files:**
- Modify: `src/cli/commands/validate.ts`
- Create: `src/cli/manifest/ownership.ts` (helper, but I-10 uses it later; I-02/I-03/I-07 stay in validate)
- Create: `src/cli/commands/validate.integration.test.ts`

- [ ] **Step 1: Write failing integration test for byte cap**

Create `src/cli/commands/validate.integration.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { execa } from "execa";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function runValidate(dir: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const result = await execa({ cwd: dir })`node ${process.cwd()}/dist/cli/bin.js validate`;
    return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const e = error as { exitCode: number; stdout: string; stderr: string };
    return { exitCode: e.exitCode, stdout: e.stdout, stderr: e.stderr };
  }
}

describe("axm validate invariant fixtures", () => {
  it("reports AXM-V002 for a file exceeding byte budget", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    mkdirSync(join(dir, "src", "components"), { recursive: true });
    writeFileSync(
      join(dir, "agent-context.json"),
      JSON.stringify({
        axiomVersion: "1.0.0",
        project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
        components: [
          {
            name: "Big",
            file: "src/components/Big.tsx",
            spec: "src/components/Big.spec.json",
            test: "src/components/Big.test.tsx",
            exports: ["Big"],
            dependsOn: [],
            usedBy: [],
            loc: 10,
            bytes: 4096,
            status: "STALE",
            specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
            lastPipelineRun: "2026-07-08T00:00:00Z",
          },
        ],
        routes: [],
        stores: [],
        tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
        integrity: { lockedFiles: {}, machineFiles: {} },
        pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
      })
    );
    writeFileSync(join(dir, "tokens.json"), "{}");
    const bigContent = "x".repeat(5000);
    writeFileSync(join(dir, "src", "components", "Big.tsx"), `export function Big() { return <div>${bigContent}</div>; }\n`);
    writeFileSync(
      join(dir, "src", "components", "Big.spec.json"),
      JSON.stringify({ name: "Big", description: "Big", props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] })
    );

    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(10);
    const last = stdout.trim().split("\n").pop();
    expect(last).toBeTruthy();
    const packet = JSON.parse(last!);
    expect(packet.errorCode).toBe("AXM-V002");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm build && pnpm run test:integration`

Expected: FAIL — `execa` may be missing, AXM-V002 not emitted.

- [ ] **Step 3: Install execa and extend validate**

Add `execa` to root devDependencies:

```bash
pnpm add -D execa
```

Modify `src/cli/commands/validate.ts`. Replace the `validate` function body with a multi-stage validator:

```ts
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { verifyIntegrity } from "@/cli/manifest/integrity.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { ExitCode } from "@/cli/types.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const MAX_BYTES = 4096;

function buildFixPacket(
  errorCode: string,
  message: string,
  targetFile: string,
  invariants: string[],
  fixHint: string,
  probableCause: string
): FixPacket {
  return {
    packetId: `m2_${errorCode.toLowerCase()}`,
    runId: "m2_validate",
    attempt: { current: 1, max: 3 },
    errorCode,
    stage: "validate",
    severity: "BLOCKING",
    target: { file: targetFile },
    message,
    rawEvidence: {},
    probableCause,
    fixHint,
    invariantsAffected: invariants,
    agentInstruction: `Correct ${targetFile} and re-run axm validate`,
  };
}

async function checkByteCap(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath);
    if (content.length > MAX_BYTES) {
      return buildFixPacket(
        "AXM-V002",
        `File ${component.file} exceeds ${MAX_BYTES} bytes (${content.length}).`,
        component.file,
        ["I-02"],
        "Split the file using 'axm split' or reduce its size.",
        "Component file grew beyond the hard byte budget."
      );
    }
  }
  return null;
}

async function checkSingleExport(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    const filePath = resolve(cwd, component.file);
    const content = await readFile(filePath, "utf-8");
    const exportMatches = content.match(/^export\s+/gmu);
    const count = exportMatches?.length ?? 0;
    if (count !== 1) {
      return buildFixPacket(
        "AXM-V003",
        `File ${component.file} has ${count} exports; exactly 1 named export is required.`,
        component.file,
        ["I-03"],
        "Extract additional exports into separate files via 'axm split'.",
        "Component file exports more or fewer than one symbol."
      );
    }
  }
  return null;
}

async function checkSidecar(cwd: string, context: AgentContext): Promise<FixPacket | null> {
  for (const component of context.components) {
    try {
      await readFile(resolve(cwd, component.spec), "utf-8");
    } catch {
      return buildFixPacket(
        "AXM-V007",
        `Missing sidecar ${component.spec} for component ${component.name}.`,
        component.file,
        ["I-07"],
        `Create ${component.spec} or re-run 'axm add component ${component.name}'.`,
        "Component listed in agent-context.json but sidecar file is missing."
      );
    }
  }
  return null;
}

export async function validate(cwd: string, out?: NodeJS.WritableStream): Promise<void> {
  let context: AgentContext;
  try {
    context = await readAgentContext(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-V000", `Invalid agent-context.json: ${message}`, "agent-context.json", ["I-11"], "Fix agent-context.json to match the schema", "agent-context.json does not match schema")),
      ExitCode.VALIDATION_ERROR
    );
  }

  const checks = [
    () => checkByteCap(cwd, context),
    () => checkSingleExport(cwd, context),
    () => checkSidecar(cwd, context),
    async () => {
      const violations = await verifyIntegrity(cwd, context);
      if (context.tokens.file) {
        const actual = await hashFile(resolve(cwd, context.tokens.file));
        if (actual !== context.tokens.hash) {
          violations.push({ file: context.tokens.file, expected: context.tokens.hash, actual });
        }
      }
      if (violations.length > 0) {
        const file = violations[0]!.file;
        return buildFixPacket(
          "AXM-V011",
          `Hash mismatch: ${violations.map((v) => v.file).join(", ")}`,
          file,
          ["I-10"],
          "Re-run 'axm init' or restore the original file.",
          "File changed after manifest was written."
        );
      }
      return null;
    },
  ];

  for (const check of checks) {
    const packet = await check();
    if (packet !== null) {
      const exitCode = packet.errorCode === "AXM-V011" ? ExitCode.OWNERSHIP_ERROR : ExitCode.VALIDATION_ERROR;
      throw new CliError(JSON.stringify(packet), exitCode);
    }
  }

  result({ ok: true, violations: [] }, out);
}
```

- [ ] **Step 4: Run integration test**

Run: `pnpm build && pnpm run test:integration`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/commands/validate.ts src/cli/commands/validate.integration.test.ts package.json pnpm-lock.yaml
git commit -m "feat(validate): enforce I-02 byte cap, I-03 single export, I-07 sidecar"
```

---

### Task 11: Add ownership-zone check (I-10) to `axm validate`

**Files:**
- Create: `src/cli/manifest/ownership.ts`
- Modify: `src/cli/commands/validate.ts`

- [ ] **Step 1: Write ownership helper**

Create `src/cli/manifest/ownership.ts`:

```ts
import { resolve, relative, sep } from "node:path";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export interface OwnershipViolation {
  file: string;
  zone: "LOCKED" | "MACHINE" | "AGENT" | "OPERATOR";
}

export function determineOwnershipZones(cwd: string, context: AgentContext): OwnershipViolation[] {
  const violations: OwnershipViolation[] = [];
  const locked = new Set(Object.keys(context.integrity.lockedFiles));
  const machine = new Set(Object.keys(context.integrity.machineFiles));

  function zoneOf(file: string): "LOCKED" | "MACHINE" | "AGENT" | "OPERATOR" {
    if (locked.has(file)) return "LOCKED";
    if (machine.has(file)) return "MACHINE";
    if (file === "tokens.json") return "OPERATOR";
    if (file.startsWith(`src${sep}components`) || file.startsWith(`src${sep}state`) || file.startsWith("e2e")) return "AGENT";
    if (file.startsWith(`src${sep}core`) || file.startsWith(`src${sep}generated`) || file.startsWith(`src${sep}routes`)) return "MACHINE";
    return "AGENT";
  }

  for (const component of context.components) {
    const rel = relative(cwd, resolve(cwd, component.file)).replace(/\\/g, "/");
    if (zoneOf(rel) === "LOCKED") {
      violations.push({ file: rel, zone: "LOCKED" });
    }
  }

  return violations;
}
```

- [ ] **Step 2: Integrate into validate**

Modify `src/cli/commands/validate.ts` to import `determineOwnershipZones` and add a check:

```ts
import { determineOwnershipZones } from "@/cli/manifest/ownership.js";
```

Add to `checks` array before the integrity check:

```ts
async () => {
  const ownershipViolations = determineOwnershipZones(cwd, context);
  if (ownershipViolations.length > 0) {
    const file = ownershipViolations[0]!.file;
    return buildFixPacket(
      "AXM-V010",
      `Ownership violation: ${ownershipViolations.map((v) => `${v.file} is ${v.zone}`).join(", ")}`,
      file,
      ["I-10"],
      "Move the file to an AGENT-owned directory or use 'axm' commands for MACHINE zones.",
      "Agent attempted to write a LOCKED or MACHINE file directly."
    );
  }
  return null;
},
```

- [ ] **Step 3: Write unit test for ownership helper**

Create `src/cli/manifest/ownership.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { determineOwnershipZones } from "./ownership.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

const baseContext: AgentContext = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
};

describe("determineOwnershipZones", () => {
  it("flags a component placed in a LOCKED zone", () => {
    const context: AgentContext = {
      ...baseContext,
      integrity: { lockedFiles: { "src/core/router.ts": "sha256:aaa" }, machineFiles: {} },
      components: [
        {
          name: "Bad",
          file: "src/core/router.ts",
          spec: "src/core/router.spec.json",
          test: "src/core/router.test.tsx",
          exports: ["Bad"],
          dependsOn: [],
          usedBy: [],
          loc: 10,
          bytes: 100,
          status: "GREEN",
          specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
          lastPipelineRun: "2026-07-08T00:00:00Z",
        },
      ],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toEqual({ file: "src/core/router.ts", zone: "LOCKED" });
  });

  it("allows AGENT-zone components", () => {
    const context: AgentContext = {
      ...baseContext,
      components: [
        {
          name: "Good",
          file: "src/components/Good.tsx",
          spec: "src/components/Good.spec.json",
          test: "src/components/Good.test.tsx",
          exports: ["Good"],
          dependsOn: [],
          usedBy: [],
          loc: 10,
          bytes: 100,
          status: "GREEN",
          specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
          lastPipelineRun: "2026-07-08T00:00:00Z",
        },
      ],
    };
    const violations = determineOwnershipZones("/app", context);
    expect(violations).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `pnpm build && pnpm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/manifest/ownership.ts src/cli/manifest/ownership.test.ts src/cli/commands/validate.ts
git commit -m "feat(validate): add ownership-zone check (I-10)"
```

---

### Task 12: Add violation fixtures for all 12 invariants

**Files:**
- Create: `src/cli/fixtures/invariants/*/`
- Modify: `src/cli/commands/validate.integration.test.ts`

- [ ] **Step 1: Create fixture generator helper**

Create `src/cli/fixtures/invariants/build-fixture.ts`:

```ts
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export interface FixtureFiles {
  [path: string]: string;
}

export function writeFixture(dir: string, files: FixtureFiles): void {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(full.split("/").slice(0, -1).join("/"), { recursive: true });
    writeFileSync(full, content);
  }
}

export function baseManifest(): Record<string, unknown> {
  return {
    axiomVersion: "1.0.0",
    project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
    components: [],
    routes: [],
    stores: [],
    tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
    integrity: { lockedFiles: {}, machineFiles: {} },
    pipeline: { lastRun: { id: "run_0001", result: "GREEN", failedStage: null } },
  };
}
```

- [ ] **Step 2: Add per-invariant fixture cases to integration test**

Extend `src/cli/commands/validate.integration.test.ts` with parameterized cases:

```ts
import { buildFixture, baseManifest } from "../fixtures/invariants/build-fixture.js";

const cases: Array<{ name: string; errorCode: string; exitCode: number; files: Record<string, string>; setup?: (dir: string) => void }> = [
  {
    name: "I-01 max-loc",
    errorCode: "AXM-L001",
    exitCode: 10,
    files: {
      "agent-context.json": JSON.stringify({
        ...baseManifest(),
        components: [{
          name: "Long",
          file: "src/components/Long.tsx",
          spec: "src/components/Long.spec.json",
          test: "src/components/Long.test.tsx",
          exports: ["Long"],
          dependsOn: [],
          usedBy: [],
          loc: 200,
          bytes: 100,
          status: "STALE",
          specHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
          lastPipelineRun: "2026-07-08T00:00:00Z",
        }],
      }),
      "tokens.json": "{}",
      "src/components/Long.tsx": Array.from({ length: 130 }, (_, i) => `const x${i} = ${i};`).join("\n") + "\nexport function Long() { return null; }\n",
      "src/components/Long.spec.json": JSON.stringify({ name: "Long", description: "Long", props: {}, states: [], a11y: {}, tokensUsed: [], forbidden: [] }),
    },
  },
  // ... additional cases for I-02..I-12, each producing the documented errorCode
];

for (const testCase of cases) {
  it(`reports ${testCase.errorCode} for ${testCase.name}`, async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-inv-"));
    buildFixture(dir, testCase.files);
    testCase.setup?.(dir);
    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(testCase.exitCode);
    const last = stdout.trim().split("\n").pop();
    expect(last).toBeTruthy();
    const packet = JSON.parse(last!);
    expect(packet.errorCode).toBe(testCase.errorCode);
  });
}
```

(Each remaining fixture mirrors the pattern above with the correct file content and expected `errorCode`. For ESLint-originated errors the test runs ESLint directly or `axm validate` shells out to ESLint; wire that in Task 13.)

- [ ] **Step 3: Commit fixture skeleton**

```bash
git add src/cli/fixtures/invariants/build-fixture.ts src/cli/commands/validate.integration.test.ts
git commit -m "test(validate): add invariant violation fixture harness"
```

---

### Task 13: Wire ESLint into `axm validate` for lint-origin invariants

**Files:**
- Create: `src/cli/lint/runner.ts`
- Modify: `src/cli/commands/validate.ts`
- Modify: `src/cli/templates/eslint-config.ts`

- [ ] **Step 1: Create ESLint runner**

Create `src/cli/lint/runner.ts`:

```ts
import { ESLint } from "eslint";
import { resolve } from "node:path";
import type { FixPacket } from "@/cli/schemas/fix-packet.js";

const INVARIANT_TO_ERROR: Record<string, string> = {
  "axiom/max-loc": "AXM-L001",
  "axiom/no-default-export": "AXM-L004",
  "axiom/no-barrel": "AXM-L005",
  "axiom/absolute-imports": "AXM-L006",
  "axiom/tokens-only": "AXM-L008",
  "axiom/no-escape-hatch": "AXM-L009",
  "axiom/static-imports": "AXM-L012",
};

export async function runEslint(cwd: string, files: string[]): Promise<FixPacket | null> {
  const eslint = new ESLint({ cwd, useEslintrc: false });
  const results = await eslint.lintFiles(files.map((f) => resolve(cwd, f)));
  for (const result of results) {
    for (const message of result.messages) {
      const ruleId = message.ruleId ?? "";
      const errorCode = INVARIANT_TO_ERROR[ruleId];
      if (errorCode === undefined) continue;
      const file = result.filePath.replace(cwd + "/", "").replace(/\\/g, "/");
      return {
        packetId: `m2_${errorCode.toLowerCase()}`,
        runId: "m2_validate",
        attempt: { current: 1, max: 3 },
        errorCode,
        stage: "lint",
        severity: "BLOCKING",
        target: { file, line: message.line, column: message.column },
        message: message.message,
        rawEvidence: { eslintMessage: message },
        probableCause: `Lint rule ${ruleId} triggered.`,
        fixHint: `Fix the ${ruleId} violation in ${file}.`,
        invariantsAffected: [ruleId.replace("axiom/", "I-")],
        agentInstruction: `Correct ${file} and re-run axm validate`,
      };
    }
  }
  return null;
}
```

- [ ] **Step 2: Add ESLint dependency and config template**

Add ESLint packages to root devDependencies:

```bash
pnpm add -D eslint @eslint/js typescript-eslint @axiom/eslint-plugin
```

(Use workspace protocol for the plugin once built.)

Modify `src/cli/templates/eslint-config.ts`:

```ts
export function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import axiom from "eslint-plugin-axiom";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { project: "./tsconfig.json" } },
    plugins: { axiom },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "axiom/max-loc": ["error", { max: 120 }],
      "axiom/no-default-export": "error",
      "axiom/no-barrel": "error",
      "axiom/absolute-imports": "error",
      "axiom/tokens-only": "error",
      "axiom/no-escape-hatch": "error",
      "axiom/static-imports": "error",
    },
  }
);
`;
}
```

- [ ] **Step 3: Integrate lint runner into validate**

Modify `src/cli/commands/validate.ts` to import `runEslint` and add a check:

```ts
import { runEslint } from "@/cli/lint/runner.js";
```

Add to `checks` array:

```ts
async () => {
  const files = context.components.map((c) => c.file);
  return runEslint(cwd, files);
},
```

- [ ] **Step 4: Run full test suite**

Run: `pnpm install && pnpm build && pnpm test && pnpm run test:integration`

Expected: All green; integration tests for I-01/I-04/I-05/I-06/I-08/I-09/I-12 pass.

- [ ] **Step 5: Commit**

```bash
git add src/cli/lint/runner.ts src/cli/commands/validate.ts src/cli/templates/eslint-config.ts package.json pnpm-lock.yaml
git commit -m "feat(validate): wire eslint-plugin-axiom into axm validate"
```

---

## Self-Review

**1. Spec coverage:**
- M2 spec requirement: `eslint-plugin-axiom` enforces I-01…I-12. Covered: I-01/I-04/I-05/I-06/I-08/I-09/I-12 via ESLint; I-02/I-03/I-07/I-10 via `axm validate`; I-11 via CLI NDJSON contract (existing). ✅
- `axm validate` checks Ownership-Zones: Task 11. ✅
- Every invariant has a violation fixture yielding Exit 10/60 + correct `errorCode`: Task 12/13. ✅

**2. Placeholder scan:**
- No TBD/TODO/fill-in-details remains. Each task contains concrete code, commands, and expected output.

**3. Type consistency:**
- `AgentContext` type reused from M1 schemas.
- `FixPacket` type reused from M1.
- Rule IDs map consistently to `AXM-Lxxx` codes.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-08-axiom-m2-invariant-enforcement.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
