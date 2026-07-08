export interface AppFile {
  path: string;
  content: string;
}

export function appFiles(projectName: string): AppFile[] {
  const files: AppFile[] = [
    { path: "package.json", content: packageJson(projectName) },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "vite.config.ts", content: viteConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "src/styles.css", content: stylesCss() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "agent-context.json", content: agentContextJson(projectName) },
    { path: "tokens.json", content: tokensJson() },
    { path: ".cursorrules", content: cursorRules() },
    { path: "CLAUDE.md", content: claudeMd() },
    { path: "src/core/router.ts", content: routerTs() },
    { path: "src/core/error-boundary.tsx", content: errorBoundaryTsx() },
    { path: "src/core/token-provider.tsx", content: tokenProviderTsx() },
    { path: "src/generated/theme.css", content: themeCss() },
    { path: "src/main.tsx", content: mainTsx() },
    { path: "src/App.tsx", content: appTsx() },
    { path: "index.html", content: indexHtml(projectName) },
    { path: ".gitignore", content: gitignore() },
  ];
  return files;
}

function packageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "0.1.0",
      private: true,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
        test: "vitest run --reporter=json",
        "test:e2e": "playwright test --reporter=json",
        lint: "eslint .",
      },
      dependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
        zustand: "^5.0.0",
        zod: "^3.24.0",
      },
      devDependencies: {
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.3.0",
        "@playwright/test": "^1.49.0",
        "axe-core": "^4.10.0",
        "@axe-core/playwright": "^4.10.0",
        eslint: "^9.17.0",
        "typescript-eslint": "^8.19.0",
        typescript: "^5.7.0",
        vite: "^6.0.0",
        vitest: "^3.0.0",
        "@testing-library/react": "^16.1.0",
        "@testing-library/dom": "^10.4.0",
        "happy-dom": "^16.0.0",
        tailwindcss: "^4.0.0",
      },
    },
    null,
    2
  );
}

function tsConfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        outDir: "./dist",
        rootDir: "./src",
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
        strict: true,
        noUncheckedIndexedAccess: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        noEmit: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  );
}

function viteConfigTs(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
`;
}

function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { project: "./tsconfig.json" } },
    rules: {},
  }
);
`;
}

function stylesCss(): string {
  return `@import "tailwindcss";
@import "./generated/theme.css";

@layer base {
  body {
    background-color: var(--color-surface-base);
    color: var(--color-text-primary);
    font-family: system-ui, sans-serif;
  }
}
`;
}

function axiomConfigJson(): string {
  return JSON.stringify(
    {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: {
        stages: ["validate", "typecheck", "lint", "unit", "e2e"],
        e2eOn: "route-change",
      },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
    },
    null,
    2
  );
}

function agentContextJson(name: string): string {
  return JSON.stringify(
    {
      axiomVersion: "1.0.0",
      project: {
        name,
        tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 },
      },
      components: [],
      routes: [],
      stores: [],
      tokens: { file: "tokens.json", hash: "sha256:PLACEHOLDER" },
      integrity: { lockedFiles: {}, machineFiles: {} },
      pipeline: { lastRun: null },
    },
    null,
    2
  );
}

function tokensJson(): string {
  return JSON.stringify(
    {
      color: {
        action: { primary: "#4F46E5", danger: "#DC2626" },
        surface: { base: "#0B0F19", raised: "#151B2B" },
        text: { primary: "#F5F7FA", muted: "#8A93A6" },
      },
      space: { "1": "4px", "2": "8px", "4": "16px", "8": "32px" },
      radius: { sm: "4px", md: "8px", full: "9999px" },
      font: { size: { sm: "14px", base: "16px", xl: "24px" } },
    },
    null,
    2
  );
}

function cursorRules(): string {
  return `# AXIOM Agent Rules
- Lies zuerst agent-context.json, nicht das Repo.
- Ein FIX_PACKET = eine Korrektur = ein Re-Run.
- Splitte Dateien statt Budgets zu überschreiten.
- Keine Default-Exports, keine Barrel-Files, nur @/-Imports.
- Keine Raw-Farbwerte, keine Pixel, keine dynamischen Imports.
`;
}

function claudeMd(): string {
  return `# AXIOM Agent Onboarding

## Kardinalregeln
1. Lies das Manifest (\`agent-context.json\`), nicht das Repo.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite Budgets nicht; verwende \`axm split\`.

## Invarianten
- I-01: Max 120 LOC/Datei
- I-02: Max 4096 Bytes/Datei
- I-03: Ein benannter Export pro Komponente
- I-04: Keine Default-Exports
- I-05: Keine Barrel-Files
- I-06: Nur @/-Imports
- I-07: Jede Komponente hat ein .spec.json
- I-08: Nur Token-Referenzen
- I-09: Kein any, @ts-ignore, eslint-disable
- I-10: Ownership-Zonen beachten
- I-11: CLI-Output = NDJSON
- I-12: Keine dynamischen Imports mit variablen Pfaden

## CLI-Spickzettel
- axm add component <Name>
- axm add route <path> --component <Name>
- axm validate
- axm pipeline run
- axm context slice --for <file>
- axm split <file> --at <export|line>
`;
}

function routerTs(): string {
  return `import type { ReactNode } from "react";

export interface Route {
  path: string;
  component: ReactNode;
}

export function Router({ routes }: { routes: Route[] }): ReactNode {
  const current = routes.find((r) => r.path === window.location.pathname) ?? routes[0];
  return current?.component ?? null;
}
`;
}

function errorBoundaryTsx(): string {
  return `import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Error is silently captured; logging strategy is added in a later milestone.
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
`;
}

function tokenProviderTsx(): string {
  return `import type { ReactNode } from "react";

export function TokenProvider({ children }: { children: ReactNode }): ReactNode {
  return children;
}
`;
}

function themeCss(): string {
  return `:root {
  --color-action-primary: #4F46E5;
  --color-action-danger: #DC2626;
  --color-surface-base: #0B0F19;
  --color-surface-raised: #151B2B;
  --color-text-primary: #F5F7FA;
  --color-text-muted: #8A93A6;
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-8: 32px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-full: 9999px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-xl: 24px;
}
`;
}

function mainTsx(): string {
  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/styles.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;
}

function appTsx(): string {
  return `import { ErrorBoundary } from "@/core/error-boundary";
import { Router } from "@/core/router";
import { TokenProvider } from "@/core/token-provider";

export function App() {
  return (
    <ErrorBoundary fallback={<div>AXIOM Error</div>}>
      <TokenProvider>
        <Router routes={[]} />
      </TokenProvider>
    </ErrorBoundary>
  );
}
`;
}

function indexHtml(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function gitignore(): string {
  return `node_modules/
dist/
*.log
.DS_Store
.env
.env.local
coverage/
playwright-report/
test-results/
`;
}
