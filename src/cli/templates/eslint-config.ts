export function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import next from "eslint-config-next";
import axiom from "eslint-plugin-axiom";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".next/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  next,
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
