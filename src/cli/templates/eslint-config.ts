export function eslintConfigJs(): string {
  return `import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import axiom from "eslint-plugin-axiom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".next/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
      "axiom/require-axm-id": "error",
      "axiom/no-raw-motion-engine": "error",
    },
  }
);
`;
}
