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
    exclude: ["node_modules/**", "dist/**", "packages/**", "e2e/**"],
  },
});
`;
}
