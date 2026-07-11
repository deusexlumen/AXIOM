import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NODE_PATH = path.resolve(__dirname, "node_modules");

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    globals: false,
    environment: "node",
    reporters: ["json"],
    outputFile: "./pipeline/reports/vitest-integration.json",
    hookTimeout: 300000,
    testTimeout: 120000,
    globalSetup: ["./src/test/integration.config.ts"],
    maxWorkers: 3,
    exclude: ["node_modules/**", "dist/**", "test-app/**", "packages/**"],
  },
});
