export function eslintConfigJs(): string {
  return `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import axiom from "eslint-plugin-axiom";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".next/**",
      "packages/**",
      "next-env.d.ts",
      "eslint.config.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: { parserOptions: { project: "./tsconfig.json" } },
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ["next.config.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js"],
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
      "axiom/motion-token-usage": "error",
      "axiom/no-direct-timeline": "error",
      "axiom/require-reduced-motion": "error",
    },
  }
);
`;
}
