export function packageJson(name: string): string {
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
        "@eslint/js": "^9.17.0",
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

export function tsConfigJson(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        jsx: "react-jsx",
        outDir: "./dist",
        rootDir: ".",
        baseUrl: ".",
        paths: { "@/*": ["./src/*"] },
        strict: true,
        noUncheckedIndexedAccess: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        allowJs: true,
        noEmit: true,
      },
      include: ["src/**/*", "*.config.ts", "*.config.js"],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  );
}

export function viteConfigTs(): string {
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

export function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { project: "./tsconfig.json" } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  }
);
`;
}

export function vitestConfigTs(): string {
  return `import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: false,
    environment: "happy-dom",
    reporters: ["json"],
  },
});
`;
}
