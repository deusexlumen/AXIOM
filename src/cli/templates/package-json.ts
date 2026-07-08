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
        react: "19.0.0",
        "react-dom": "19.0.0",
        "react-error-boundary": "5.0.0",
        zustand: "5.0.3",
        zod: "^4.4.3",
      },
      devDependencies: {
        "@types/node": "22.10.5",
        "@types/react": "19.0.0",
        "@types/react-dom": "19.0.0",
        "@vitejs/plugin-react": "4.3.4",
        "@playwright/test": "1.49.1",
        "axe-core": "4.10.2",
        "@axe-core/playwright": "4.10.1",
        eslint: "9.17.0",
        "@eslint/js": "9.17.0",
        "typescript-eslint": "8.19.0",
        typescript: "5.7.2",
        vite: "6.0.5",
        vitest: "3.0.2",
        "@testing-library/react": "16.1.0",
        "@testing-library/dom": "10.4.0",
        "happy-dom": "16.3.0",
        tailwindcss: "4.0.0",
      },
    },
    null,
    2
  );
}
