# M3 Generators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `axm add component`, `axm add route`, `axm add store`, and `axm tokens build` with deterministic, byte-identical output and golden-file tests.

**Architecture:** Add generator modules under `src/cli/generators/` that produce file contents as pure functions of input + manifest state. A shared manifest mutator in `src/cli/manifest/mutate.ts` reads `agent-context.json`, applies changes, recomputes the self-hash, and writes it back. Commands live in `src/cli/commands/add.ts` and `tokens-build.ts`. Route wiring uses ts-morph to regenerate `src/generated/route-manifest.ts` from the manifest (never editing LOCKED `src/core/router.ts`). Golden-file tests run each generator twice and compare outputs byte-for-byte.

**Tech Stack:** TypeScript 5, Zod 4, ts-morph, Zustand 5 (generated stores), Vitest 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/cli/generators/component.ts` | Pure functions: `componentTs(name, spec)`, `componentSpecJson(name)`, `componentTestTs(name, spec)`. |
| `src/cli/generators/route.ts` | Pure functions: `routeTsx(path, componentName)`, `routeManifestTs(routes)`. |
| `src/cli/generators/store.ts` | Pure function: `storeTs(name, shape)`. |
| `src/cli/generators/tokens.ts` | Pure function: `themeCss(tokens)` for `axm tokens build`. |
| `src/cli/generators/types.ts` | Shared generator input types. |
| `src/cli/manifest/mutate.ts` | `readContext(cwd)`, `writeContext(cwd, context)` with self-hash recompute. |
| `src/cli/commands/add.ts` | `addComponent`, `addRoute`, `addStore` and CLI dispatch. |
| `src/cli/commands/tokens-build.ts` | `tokensBuild(cwd)` command. |
| `src/cli/bin.ts` | Wire `add` and `tokens` subcommands. |
| `src/cli/schemas/tokens.ts` | Zod schema for `tokens.json`. |
| `src/cli/commands/add.integration.test.ts` | Golden-file / integration tests for all generators. |

---

### Task 1: Add `ts-morph` dependency

**Files:**
- Modify: `package.json`
- Test: `pnpm install`

- [ ] **Step 1: Add dependency**

```json
"dependencies": {
  "eslint": "9.17.0",
  "ts-morph": "25.0.1",
  "zod": "^4.4.3",
  "zod-to-json-schema": "^3.25.2"
}
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updated, no errors.

---

### Task 2: Create `tokens.json` Zod schema

**Files:**
- Create: `src/cli/schemas/tokens.ts`
- Test: `src/cli/schemas/tokens.test.ts`

- [ ] **Step 1: Write schema**

```ts
import { z } from "zod";

export const TokenValue = z.union([z.string(), z.record(z.string())]);

export const TokensJson = z.record(z.record(TokenValue));

export type TokensJson = z.infer<typeof TokensJson>;
```

- [ ] **Step 2: Write test**

```ts
import { describe, it, expect } from "vitest";
import { TokensJson } from "@/cli/schemas/tokens.js";

describe("TokensJson schema", () => {
  it("accepts a valid token map", () => {
    const result = TokensJson.safeParse({
      color: { "action-primary": "#4F46E5" },
      space: { "2": "8px" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-object root", () => {
    const result = TokensJson.safeParse(["color"]);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/schemas/tokens.test.ts`
Expected: PASS.

---

### Task 3: Add shared manifest mutation helper

**Files:**
- Create: `src/cli/manifest/mutate.ts`
- Test: `src/cli/manifest/mutate.test.ts`

- [ ] **Step 1: Implement helper**

```ts
import { readAgentContext } from "@/cli/manifest/reader.js";
import { serializeAgentContext, writeAgentContext } from "@/cli/manifest/writer.js";
import { hashString } from "@/cli/manifest/hash.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";

export async function readContext(cwd: string): Promise<AgentContext> {
  return readAgentContext(cwd);
}

export async function writeContext(cwd: string, context: AgentContext): Promise<void> {
  const copy = JSON.parse(JSON.stringify(context)) as AgentContext;
  delete copy.integrity.machineFiles["agent-context.json"];
  const selfHash = hashString(serializeAgentContext(copy));
  context.integrity.machineFiles["agent-context.json"] = selfHash;
  await writeAgentContext(cwd, context);
}
```

- [ ] **Step 2: Write test**

```ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";

const baseCtx = {
  axiomVersion: "1.0.0",
  project: { name: "demo", tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 } },
  components: [],
  routes: [],
  stores: [],
  tokens: { file: "tokens.json", hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" },
  integrity: { lockedFiles: {}, machineFiles: {} },
  pipeline: { lastRun: null },
};

describe("manifest mutate", () => {
  it("recomputes agent-context.json hash on write", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-mutate-"));
    writeFileSync(join(dir, "agent-context.json"), JSON.stringify(baseCtx));
    const ctx = await readContext(dir);
    ctx.components.push({
      name: "X", file: "src/components/X.tsx", spec: "src/components/X.spec.json", test: "src/components/X.test.tsx",
      exports: ["X"], dependsOn: [], usedBy: [], loc: 1, bytes: 1, status: "STALE", specHash: "sha256:0".repeat(64),
    });
    await writeContext(dir, ctx);
    const written = JSON.parse(readFileSync(join(dir, "agent-context.json"), "utf-8"));
    expect(written.integrity.machineFiles["agent-context.json"]).toMatch(/^sha256:/);
    rmSync(dir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/manifest/mutate.test.ts`
Expected: PASS.

---

### Task 4: Implement component generator templates

**Files:**
- Create: `src/cli/generators/component.ts`
- Create: `src/cli/generators/types.ts`
- Test: `src/cli/generators/component.test.ts`

- [ ] **Step 1: Define generator types**

`src/cli/generators/types.ts`:
```ts
import type { ComponentSpec } from "@/cli/schemas/component-spec.js";

export interface GeneratedComponent {
  component: string;
  spec: string;
  test: string;
}

export type SpecInput = ComponentSpec;
```

- [ ] **Step 2: Implement generator**

`src/cli/generators/component.ts`:
```ts
import type { SpecInput, GeneratedComponent } from "@/cli/generators/types.js";

function propTypeToZod(prop: SpecInput["props"][string]): string {
  switch (prop.type) {
    case "string":
      return `z.string()${prop.constraints?.minLength ? `.min(${prop.constraints.minLength})` : ""}${prop.constraints?.maxLength ? `.max(${prop.constraints.maxLength})` : ""}`;
    case "number":
      return `z.number()${prop.constraints?.min ? `.min(${prop.constraints.min})` : ""}${prop.constraints?.max ? `.max(${prop.constraints.max})` : ""}`;
    case "boolean":
      return `z.boolean()`;
    case "enum":
      return `z.enum([${prop.values.map((v) => `"${v}"`).join(", ")}])${prop.default ? `.default("${prop.default}")` : ""}`;
    case "function":
      return `z.function()`;
  }
}

function defaultForProp(prop: SpecInput["props"][string]): string | undefined {
  if (prop.type === "boolean") return String(prop.default ?? false);
  if (prop.type === "enum") return prop.default ? `"${prop.default}"` : undefined;
  return undefined;
}

export function generateComponent(name: string, spec: SpecInput): GeneratedComponent {
  const propEntries = Object.entries(spec.props);
  const propNames = propEntries.map(([k]) => k);
  const propSchemaLines = propEntries.map(([k, p]) => `  ${k}: ${propTypeToZod(p)},`);
  const propsSchema = propSchemaLines.length > 0
    ? `export const ${name}Props = z.object({\n${propSchemaLines.join("\n")}\n});`
    : `export const ${name}Props = z.object({});`;
  const destructured = propNames.map((n) => {
    const def = defaultForProp(spec.props[n]!);
    return def !== undefined ? `${n} = ${def}` : n;
  }).join(", ");
  const args = propNames.length > 0 ? `{ ${destructured} }` : "_props";

  const componentTs = `// src/components/${name}.tsx — AXIOM AGENT ZONE\n// Vertrag: ./${name}.spec.json | Invarianten: I-01..I-12\nimport { z } from "zod";\nimport type { TokenRef } from "@/generated/token-types";\n\n${propsSchema}\ntype Props = z.infer<typeof ${name}Props>;\n\nexport function ${name}(${args}: Props) {\n  return (\n    <div data-axm-id="${name}">\n      {/* AGENT: implement component, only token-based Tailwind classes (I-08) */}\n    </div>\n  );\n}\n`;

  const contractTests = propEntries
    .filter(([_, p]) => p.required)
    .map(([k, _]) => `  it("requires ${k}", () => {\n    const { container } = render(<${name} ${propNames.filter((n) => n !== k).map((n) => `${n}={${n}}`).join(" ")} />);\n    expect(container).toBeTruthy();\n  });`)
    .join("\n");

  const testTs = `// src/components/${name}.test.tsx — AXIOM AGENT ZONE\nimport { render, screen } from "@testing-library/react";\nimport { describe, it, expect, vi } from "vitest";\nimport { ${name} } from "@/components/${name}";\n\n// @axiom:contract:start sha256:0000000000000000000000000000000000000000000000000000000000000000\ndescribe("${name} [contract]", () => {\n  it("renders", () => {\n    render(<${name} ${propNames.map((n) => `${n}={${n}}`).join(" ")} />);\n    expect(screen.getByTestId("${name}")).toBeInTheDocument();\n  });\n${contractTests}\n});\n// @axiom:contract:end\n`;

  const specJson = `${JSON.stringify(spec, null, 2)}\n`;

  return { component: componentTs, spec: specJson, test: testTs };
}

export function defaultComponentSpec(name: string): SpecInput {
  return {
    name,
    description: `${name} component`,
    props: {},
    states: [],
    a11y: { role: "generic", focusable: false, requiredAria: [] },
    tokensUsed: [],
    forbidden: [],
  };
}
```

- [ ] **Step 3: Write test**

`src/cli/generators/component.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateComponent, defaultComponentSpec } from "@/cli/generators/component.js";

describe("generateComponent", () => {
  it("produces deterministic output", () => {
    const spec = defaultComponentSpec("Button");
    const a = generateComponent("Button", spec);
    const b = generateComponent("Button", spec);
    expect(a.component).toBe(b.component);
    expect(a.spec).toBe(b.spec);
    expect(a.test).toBe(b.test);
  });

  it("includes data-axm-id", () => {
    const { component } = generateComponent("Card", defaultComponentSpec("Card"));
    expect(component).toContain('data-axm-id="Card"');
  });
});
```

- [ ] **Step 4: Run test**

Run: `pnpm test src/cli/generators/component.test.ts`
Expected: PASS.

---

### Task 5: Implement route generator

**Files:**
- Create: `src/cli/generators/route.ts`
- Test: `src/cli/generators/route.test.ts`

- [ ] **Step 1: Implement generator**

`src/cli/generators/route.ts`:
```ts
import type { RouteEntry } from "@/cli/schemas/agent-context.js";

export function routeTsx(path: string, componentName: string): string {
  return `// src/routes/${componentName.toLowerCase()}.route.tsx — AXIOM MACHINE ZONE\n// Route wrapper for ${path}; default export allowed (I-04 exception).\nimport { ${componentName} } from "@/components/${componentName}";\n\nexport default function ${componentName}Route() {\n  return <${componentName} />;\n}\n`;
}

export function routeManifestTs(routes: RouteEntry[]): string {
  const imports = routes
    .map((r) => `import ${r.component}Route from "@/routes/${r.component.toLowerCase()}.route";`)
    .join("\n");
  const items = routes
    .map((r) => `  { path: "${r.path}", component: <${r.component}Route /> }`)
    .join(",\n");
  return `// src/generated/route-manifest.ts — AXIOM MACHINE ZONE\n// Generated by axm add route / axm tokens build. Do not edit.\nimport type { ReactNode } from "react";\n${imports}\n\nexport interface Route {\n  path: string;\n  component: ReactNode;\n}\n\nexport const routes: Route[] = [\n${items}\n];\n`;
}
```

- [ ] **Step 2: Write test**

`src/cli/generators/route.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { routeTsx, routeManifestTs } from "@/cli/generators/route.js";

describe("route generator", () => {
  it("route wrapper is deterministic", () => {
    const a = routeTsx("/", "Home");
    const b = routeTsx("/", "Home");
    expect(a).toBe(b);
    expect(a).toContain("export default function HomeRoute()");
  });

  it("manifest is deterministic", () => {
    const a = routeManifestTs([{ path: "/", component: "Home", file: "src/routes/home.route.tsx" }]);
    const b = routeManifestTs([{ path: "/", component: "Home", file: "src/routes/home.route.tsx" }]);
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/generators/route.test.ts`
Expected: PASS.

---

### Task 6: Implement store generator

**Files:**
- Create: `src/cli/generators/store.ts`
- Test: `src/cli/generators/store.test.ts`

- [ ] **Step 1: Implement generator**

`src/cli/generators/store.ts`:
```ts
export type StoreShape = Record<string, "string" | "number" | "boolean">;

export function generateStore(name: string, shape: StoreShape): string {
  const capitalized = name[0]!.toUpperCase() + name.slice(1);
  const fields = Object.entries(shape)
    .map(([k, t]) => `  ${k}: z.${t}(),`)
    .join("\n");
  const defaults = Object.entries(shape)
    .map(([k, t]) => `    ${k}: ${t === "boolean" ? "false" : t === "number" ? "0" : '"""},`)
    .join("\n");
  return `// src/state/${name}Store.ts — AXIOM AGENT ZONE\nimport { create } from "zustand";\nimport { z } from "zod";\n\nexport const ${capitalized}Shape = z.object({\n${fields}\n});\n\nexport type ${capitalized}State = z.infer<typeof ${capitalized}Shape>;\n\nexport const use${capitalized} = create<${capitalized}State>(() => (${defaults ? `{\n${defaults}\n  }` : "({})"}));\n`;
}
```

- [ ] **Step 2: Write test**

`src/cli/generators/store.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateStore } from "@/cli/generators/store.js";

describe("generateStore", () => {
  it("is deterministic", () => {
    const a = generateStore("counter", { count: "number" });
    const b = generateStore("counter", { count: "number" });
    expect(a).toBe(b);
  });

  it("produces a named export", () => {
    const code = generateStore("user", { name: "string" });
    expect(code).toContain("export const useUser");
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/generators/store.test.ts`
Expected: PASS.

---

### Task 7: Implement token theme generator

**Files:**
- Create: `src/cli/generators/tokens.ts`
- Test: `src/cli/generators/tokens.test.ts`

- [ ] **Step 1: Implement generator**

`src/cli/generators/tokens.ts`:
```ts
import type { TokensJson } from "@/cli/schemas/tokens.js";

export function themeCss(tokens: TokensJson): string {
  const rootLines: string[] = [];
  const themeLines: string[] = [];
  for (const [category, values] of Object.entries(tokens)) {
    for (const [name, value] of Object.entries(values)) {
      const varName = `--${category}-${name}`;
      const cssValue = typeof value === "string" ? value : value.value;
      rootLines.push(`  ${varName}: ${cssValue};`);
      const tailwindName = name.includes("-") ? name : `${category}-${name}`;
      themeLines.push(`  --${tailwindName}: var(${varName});`);
    }
  }
  return `:root {\n${rootLines.join("\n")}\n}\n\n@theme inline {\n${themeLines.join("\n")}\n}\n`;
}
```

- [ ] **Step 2: Write test**

`src/cli/generators/tokens.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { themeCss } from "@/cli/generators/tokens.js";

describe("themeCss", () => {
  it("is deterministic", () => {
    const tokens = { color: { primary: "#000" } };
    expect(themeCss(tokens)).toBe(themeCss(tokens));
  });

  it("emits :root and @theme inline blocks", () => {
    const css = themeCss({ color: { primary: "#000" } });
    expect(css).toContain(":root");
    expect(css).toContain("@theme inline");
    expect(css).toContain("--color-primary: var(--color-primary)");
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm test src/cli/generators/tokens.test.ts`
Expected: PASS.

---

### Task 8: Implement `axm add component` command

**Files:**
- Create: `src/cli/commands/add.ts`
- Modify: `src/cli/bin.ts`

- [ ] **Step 1: Implement addComponent**

`src/cli/commands/add.ts` (initial):
```ts
import { resolve, join } from "node:path";
import { writeFile } from "node:fs/promises";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { generateComponent, defaultComponentSpec } from "@/cli/generators/component.js";
import { ComponentSpec } from "@/cli/schemas/component-spec.js";
import { hashString } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export interface AddComponentOptions {
  cwd?: string;
  spec?: string;
  out?: NodeJS.WritableStream;
}

export async function addComponent(name: string, options: AddComponentOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const context = await readContext(cwd);
  const file = `src/components/${name}.tsx`;
  const specFile = `src/components/${name}.spec.json`;
  const testFile = `src/components/${name}.test.tsx`;

  if (context.components.some((c) => c.name === name)) {
    throw new CliError(JSON.stringify({ errorCode: "AXM-V040", message: `Component ${name} already exists` }), ExitCode.VALIDATION_ERROR);
  }

  const spec = options.spec
    ? ComponentSpec.parse(JSON.parse(options.spec))
    : defaultComponentSpec(name);

  const generated = generateComponent(name, spec);
  await writeFile(resolve(cwd, file), generated.component);
  await writeFile(resolve(cwd, specFile), generated.spec);
  await writeFile(resolve(cwd, testFile), generated.test);

  context.components.push({
    name,
    file,
    spec: specFile,
    test: testFile,
    exports: [name],
    dependsOn: [],
    usedBy: [],
    loc: generated.component.split("\n").length,
    bytes: Buffer.byteLength(generated.component),
    status: "STALE",
    specHash: `sha256:${hashString(generated.spec)}`,
  });
  await writeContext(cwd, context);

  result({ ok: true, files: { component: file, spec: specFile, test: testFile }, status: "STALE" }, options.out);
}
```

- [ ] **Step 2: Wire bin.ts**

Add after `validate` branch:
```ts
if (command === "add") {
  const sub = args[0];
  if (sub === "component") {
    const name = args[1];
    if (!name) throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", "Missing component name", ["I-11"])), ExitCode.VALIDATION_ERROR);
    await addComponent(name);
    return ExitCode.OK;
  }
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", `Unknown add subcommand: ${sub}`, ["I-11"])), ExitCode.VALIDATION_ERROR);
}
```

- [ ] **Step 3: Build and smoke test**

Run:
```bash
pnpm build
node dist/cli/bin.js init /tmp/axiom-add-smoke --skip-install
node dist/cli/bin.js add component Button
```
Expected: `src/components/Button.tsx`, `.spec.json`, `.test.tsx` created in `/tmp/axiom-add-smoke`.

---

### Task 9: Implement `axm add route` command

**Files:**
- Modify: `src/cli/commands/add.ts`
- Modify: `src/cli/bin.ts`
- Modify: `src/cli/templates/core.ts` (router to accept routes prop from manifest)

- [ ] **Step 1: Update router template**

`src/cli/templates/core.ts`:
```ts
export function routerTs(): string {
  return `import type { ReactNode } from "react";\nimport { routes } from "@/generated/route-manifest";\n\nexport interface Route {\n  path: string;\n  component: ReactNode;\n}\n\nexport function Router(): ReactNode {\n  const current = routes.find((r) => r.path === window.location.pathname) ?? routes[0];\n  return current?.component ?? null;\n}\n`;
}
```

- [ ] **Step 2: Implement addRoute**

Add to `src/cli/commands/add.ts`:
```ts
import { routeTsx, routeManifestTs } from "@/cli/generators/route.js";

export interface AddRouteOptions {
  cwd?: string;
  out?: NodeJS.WritableStream;
}

export async function addRoute(path: string, componentName: string, options: AddRouteOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const context = await readContext(cwd);
  const component = context.components.find((c) => c.name === componentName);
  if (!component) {
    throw new CliError(JSON.stringify({ errorCode: "AXM-V040", message: `Component ${componentName} not found` }), ExitCode.VALIDATION_ERROR);
  }
  const file = `src/routes/${componentName.toLowerCase()}.route.tsx`;
  if (context.routes.some((r) => r.path === path)) {
    throw new CliError(JSON.stringify({ errorCode: "AXM-V040", message: `Route ${path} already exists` }), ExitCode.VALIDATION_ERROR);
  }

  await writeFile(resolve(cwd, file), routeTsx(path, componentName));
  context.routes.push({ path, component: componentName, file });
  await writeFile(resolve(cwd, "src/generated/route-manifest.ts"), routeManifestTs(context.routes));
  await writeContext(cwd, context);
  result({ ok: true, files: { route: file, manifest: "src/generated/route-manifest.ts" }, status: "STALE" }, options.out);
}
```

- [ ] **Step 3: Update main.tsx template**

`src/cli/templates/app-entry.ts`:
Update `mainTsx()` to use `Router()` without props:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TokenProvider } from "@/core/token-provider";
import { Router } from "@/core/router";

const el = document.getElementById("root");
if (!el) throw new Error("Missing root element");
createRoot(el).render(\n  <StrictMode>\n    <TokenProvider>\n      <Router />\n    </TokenProvider>\n  </StrictMode>\n);
```

- [ ] **Step 4: Wire bin.ts**

Add route branch:
```ts
if (sub === "route") {
  const path = args[1];
  const component = args[args.indexOf("--component") + 1];
  if (!path || !component) throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", "Usage: axm add route <path> --component <Name>", ["I-11"])), ExitCode.VALIDATION_ERROR);
  await addRoute(path, component);
  return ExitCode.OK;
}
```

- [ ] **Step 5: Smoke test**

Run:
```bash
pnpm build
node dist/cli/bin.js init /tmp/axiom-route-smoke --skip-install
node dist/cli/bin.js add component Home
node dist/cli/bin.js add route / --component Home
```
Expected: `src/routes/home.route.tsx` and `src/generated/route-manifest.ts` created.

---

### Task 10: Implement `axm add store` command

**Files:**
- Modify: `src/cli/commands/add.ts`
- Modify: `src/cli/bin.ts`

- [ ] **Step 1: Implement addStore**

Add to `src/cli/commands/add.ts`:
```ts
import { generateStore, type StoreShape } from "@/cli/generators/store.js";

export interface AddStoreOptions {
  cwd?: string;
  shape?: string;
  out?: NodeJS.WritableStream;
}

export async function addStore(name: string, options: AddStoreOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const context = await readContext(cwd);
  const file = `src/state/${name}Store.ts`;
  if (context.stores.some((s) => s.name === name)) {
    throw new CliError(JSON.stringify({ errorCode: "AXM-V040", message: `Store ${name} already exists` }), ExitCode.VALIDATION_ERROR);
  }
  const shape: StoreShape = options.shape ? JSON.parse(options.shape) : {};
  const content = generateStore(name, shape);
  await writeFile(resolve(cwd, file), content);
  context.stores.push({ name, file, shapeHash: `sha256:${hashString(JSON.stringify(shape))}` });
  await writeContext(cwd, context);
  result({ ok: true, files: { store: file }, status: "STALE" }, options.out);
}
```

- [ ] **Step 2: Wire bin.ts**

Add store branch:
```ts
if (sub === "store") {
  const name = args[1];
  const shapeIdx = args.indexOf("--shape");
  const shape = shapeIdx >= 0 ? args[shapeIdx + 1] : undefined;
  if (!name) throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", "Missing store name", ["I-11"])), ExitCode.VALIDATION_ERROR);
  await addStore(name, { shape });
  return ExitCode.OK;
}
```

- [ ] **Step 3: Smoke test**

Run:
```bash
pnpm build
node dist/cli/bin.js init /tmp/axiom-store-smoke --skip-install
node dist/cli/bin.js add store counter --shape '{"count":"number"}'
```
Expected: `src/state/counterStore.ts` created.

---

### Task 11: Implement `axm tokens build` command

**Files:**
- Create: `src/cli/commands/tokens-build.ts`
- Modify: `src/cli/bin.ts`
- Modify: `src/cli/templates/manifest.ts` (initialAgentContext to reference theme.css)
- Modify: `src/cli/templates/generated.ts` (initial theme.css)

- [ ] **Step 1: Implement tokens build command**

`src/cli/commands/tokens-build.ts`:
```ts
import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { TokensJson } from "@/cli/schemas/tokens.js";
import { themeCss } from "@/cli/generators/tokens.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";

export async function tokensBuild(cwd: string, out?: NodeJS.WritableStream): Promise<void> {
  const tokensPath = resolve(cwd, "tokens.json");
  const raw = await readFile(tokensPath, "utf-8");
  const tokens = TokensJson.parse(JSON.parse(raw));
  const css = themeCss(tokens);
  const cssPath = "src/generated/theme.css";
  await writeFile(resolve(cwd, cssPath), css);
  const context = await readContext(cwd);
  context.tokens.hash = await hashFile(resolve(cwd, "tokens.json"));
  context.integrity.machineFiles[cssPath] = await hashFile(resolve(cwd, cssPath));
  await writeContext(cwd, context);
  result({ ok: true, files: [cssPath] }, out);
}
```

- [ ] **Step 2: Wire bin.ts**

Add:
```ts
if (command === "tokens") {
  const sub = args[0];
  if (sub === "build") {
    await tokensBuild(process.cwd());
    return ExitCode.OK;
  }
  throw new CliError(JSON.stringify(cliFixPacket("AXM-V000", `Unknown tokens subcommand: ${sub}`, ["I-11"])), ExitCode.VALIDATION_ERROR);
}
```

- [ ] **Step 3: Update init to use tokens build**

Modify `src/cli/commands/init.ts`:
- After writing `tokens.json`, call `tokensBuild(targetDir, options.out)` instead of writing static `theme.css` from template.
- Remove `src/generated/theme.css` from `appFiles` (it will be generated by tokens build).
- Update `ownershipFiles()` in `src/cli/templates/app.ts` if needed (theme.css stays MACHINE).

- [ ] **Step 4: Update templates/manifest.ts**

Ensure `initialAgentContext` references `tokens.json` hash correctly.

- [ ] **Step 5: Smoke test**

Run:
```bash
pnpm build
node dist/cli/bin.js init /tmp/axiom-tokens-smoke --skip-install
node dist/cli/bin.js tokens build
```
Expected: `src/generated/theme.css` contains `:root` and `@theme inline`.

---

### Task 12: Golden-file determinism tests

**Files:**
- Create: `src/cli/commands/add.integration.test.ts`

- [ ] **Step 1: Write integration test**

```ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { init } from "@/cli/commands/init.js";

function dirMap(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of readdirSync(dir, { recursive: true })) {
    const p = join(dir, rel);
    try {
      out[rel.replace(/\\/g, "/")] = readFileSync(p, "utf-8");
    } catch {
      // directories
    }
  }
  return out;
}

describe("axm add determinism", () => {
  it("component generation is byte-identical across runs", { timeout: 120000 }, async () => {
    const a = mkdtempSync(join(tmpdir(), "axiom-golden-a-"));
    const b = mkdtempSync(join(tmpdir(), "axiom-golden-b-"));
    try {
      execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
      await init("demo", { cwd: a });
      await init("demo", { cwd: b });
      execSync("node dist/cli/bin.js add component Button", { cwd: join(a, "demo"), stdio: "ignore" });
      execSync("node dist/cli/bin.js add component Button", { cwd: join(b, "demo"), stdio: "ignore" });
      expect(dirMap(join(a, "demo", "src", "components"))).toEqual(dirMap(join(b, "demo", "src", "components")));
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm run test:integration`
Expected: PASS.

---

### Task 13: Final verification

- [ ] **Step 1: Full build + unit + integration**

Run:
```bash
pnpm build
pnpm test
pnpm run test:integration
```
Expected: all green.

- [ ] **Step 2: LOC/byte budget check**

Run:
```bash
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -n | tail -20
```
Expected: no file >120 LOC.

- [ ] **Step 3: No forbidden patterns**

Run:
```bash
grep -R "any\|@ts-ignore\|eslint-disable" src/cli/generators src/cli/commands/add.ts src/cli/commands/tokens-build.ts src/cli/manifest/mutate.ts || true
```
Expected: no matches (except in legitimate type contexts).

---

## Self-Review Checklist

- [ ] Spec coverage: `axm add component` (§5.1), `axm add route` (§5.1), `axm add store` (§5.1), `axm tokens build` (§15.1), I-13 `data-axm-id`, contract block markers (§15.2), golden-file determinism (§10 M3) each map to a task.
- [ ] No placeholders: every task contains concrete code or exact commands.
- [ ] Type consistency: `AgentContext`, `ComponentSpec`, `RouteEntry`, `StoreEntry`, `TokensJson` names match existing schemas.
- [ ] No LOCKED files edited by AGENT code: route wiring regenerates `src/generated/route-manifest.ts` (MACHINE).
