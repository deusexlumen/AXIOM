import { RuleTester } from "eslint";
import { a11yInputLabel } from "@/rules/a11y-input-label.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("a11y-input-label", a11yInputLabel, {
  valid: [
    { code: 'export function F() { return <><label htmlFor="x">Name</label><input id="x" /></>; }\n' },
    { code: 'export function F() { return <input aria-label="Name" />; }\n' },
    { code: 'export function F() { return <input aria-labelledby="id" />; }\n' },
    { code: 'export function F() { return <><label htmlFor="y">Note</label><textarea id="y" /></>; }\n' },
    { code: 'export function F() { return <><label htmlFor="z">Pick</label><select id="z" /></>; }\n' },
    { code: 'export function F() { return <label><input /></label>; }\n' },
    { code: 'export function F() { return <label>Name <input /></label>; }\n' },
    { code: 'export function F() { return <label><span><input /></span></label>; }\n' },
    { code: 'export function F() { return <input aria-label={label} />; }\n' },
  ],
  invalid: [
    { code: 'export function F() { return <input />; }\n', errors: [{ messageId: "a11yInputLabel" }] },
    { code: 'export function F() { return <textarea />; }\n', errors: [{ messageId: "a11yInputLabel" }] },
    { code: 'export function F() { return <select />; }\n', errors: [{ messageId: "a11yInputLabel" }] },
    { code: 'export function F() { return <><label htmlFor="x">Name</label><input id="y" /></>; }\n', errors: [{ messageId: "a11yInputLabel" }] },
    { code: 'export function F() { return <input aria-label="" />; }\n', errors: [{ messageId: "a11yInputLabel" }] },
    { code: 'export function F() { return <><label htmlFor="">Name</label><input id="" /></>; }\n', errors: [{ messageId: "a11yInputLabel" }] },
  ],
});
