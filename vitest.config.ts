import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: false,
    environment: "node",
    reporters: ["json"],
    outputFile: "./pipeline/reports/vitest.json",
    exclude: [
      "node_modules/**",
      "dist/**",
      "test-app/**",
      "demo/**",
      "verify-app/**",
      "m1-demo/**",
      "atelier-a0-demo/**",
      "packages/**",
      "**/*/node_modules/**",
      "**/*.integration.test.ts",
      "src/cli/templates/**",
    ],
  },
});
