import { RuleTester } from "eslint";
import { a11yButtonLabel } from "@/rules/a11y-button-label.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("a11y-button-label", a11yButtonLabel, {
  valid: [
    { code: 'export function Btn() { return <button>Save</button>; }\n' },
    { code: 'export function Btn() { return <button aria-label="Save" />; }\n' },
    { code: 'export function Btn() { return <button aria-labelledby="id" />; }\n' },
    { code: 'export function Btn() { return <button title="Save" />; }\n' },
    { code: 'export function Btn() { const label = "Save"; return <button>{label}</button>; }\n' },
    { code: 'export function Btn() { return <button aria-label={label} />; }\n' },
    { code: 'export function Btn() { return <button>{0}</button>; }\n' },
  ],
  invalid: [
    { code: 'export function Btn() { return <button />; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button></button>; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button>   </button>; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button aria-label="" />; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button title={""} />; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button>{null}</button>; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
    { code: 'export function Btn() { return <button>{false}</button>; }\n', errors: [{ messageId: "a11yButtonLabel" }] },
  ],
});
