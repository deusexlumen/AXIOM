export function viteConfigTs(): string {
  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\\/api\\/(.*)$/, replacement: path.resolve(__dirname, "./api/$1") },
      { find: /^@\\/(.*)$/, replacement: path.resolve(__dirname, "./src/$1") },
    ],
  },
});
`;
}
