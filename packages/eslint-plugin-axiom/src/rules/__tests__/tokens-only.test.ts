import { RuleTester } from "eslint";
import { tokensOnly } from "@/rules/tokens-only.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("tokens-only", tokensOnly, {
  valid: [
    { code: "const c = 'bg-action-primary';\n" },
    { code: "export function Box() { return <div className=\"bg-action-primary\" />; }\n" },
  ],
  invalid: [
    { code: "const c = '#4F46E5';\n", errors: [{ messageId: "rawValue" }] },
    { code: "export function Box() { return <div style={{ color: '#4F46E5' }} />; }\n", errors: [{ messageId: "rawValue" }] },
    { code: "export function Box() { return <div className=\"w-[137px]\" />; }\n", errors: [{ messageId: "arbitraryValue" }] },
  ],
});
