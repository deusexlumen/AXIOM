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
