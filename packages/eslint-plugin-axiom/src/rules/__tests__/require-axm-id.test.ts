import { RuleTester } from "eslint";
import { requireAxmId } from "@/rules/require-axm-id.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("require-axm-id", requireAxmId, {
  valid: [
    { code: "export function Button() { return <div data-axm-id=\"Button\" />; }\n", filename: "src/components/Button.tsx" },
    { code: "export const Button = () => <div data-axm-id=\"Button\" />;\n", filename: "src/components/Button.tsx" },
    { code: "export const Button = function () { return <div data-axm-id=\"Button\" />; };\n", filename: "src/components/Button.tsx" },
    { code: "export function Button() { return <div data-axm-id=\"Button\">child</div>; }\n", filename: "src/components/Button.tsx" },
    { code: "export function Helper() { return <div />; }\n", filename: "src/core/Helper.tsx" },
    { code: "export function Button() { return <div data-axm-id=\"Button\" />; }\n", filename: "src/components/Button.ts" },
  ],
  invalid: [
    { code: "export function Button() { return <div />; }\n", filename: "src/components/Button.tsx", errors: [{ messageId: "missingAxmId" }] },
    { code: "export function Button() { return <div data-axm-id=\"Other\" />; }\n", filename: "src/components/Button.tsx", errors: [{ messageId: "missingAxmId" }] },
    { code: "export function Button() { return null; }\n", filename: "src/components/Button.tsx", errors: [{ messageId: "missingAxmId" }] },
    { code: "export const Button = () => <div />;\n", filename: "src/components/Button.tsx", errors: [{ messageId: "missingAxmId" }] },
    { code: "export const Button = function () { return <div />; };\n", filename: "src/components/Button.tsx", errors: [{ messageId: "missingAxmId" }] },
  ],
});
