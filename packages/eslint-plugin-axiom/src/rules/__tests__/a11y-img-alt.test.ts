import { RuleTester } from "eslint";
import { a11yImgAlt } from "@/rules/a11y-img-alt.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("a11y-img-alt", a11yImgAlt, {
  valid: [
    { code: 'export function Img() { return <img alt="A cat" />; }\n' },
    { code: 'export function Img() { return <img alt="" />; }\n' },
    { code: 'export function Img() { return <img alt={""} />; }\n' },
    { code: 'export function Img() { return <img alt="   " />; }\n' },
    { code: 'export function Img() { return <img alt={null} />; }\n' },
    { code: 'export function Img() { return <img alt={false} />; }\n' },
    { code: 'export function Img() { return <img aria-hidden="true" />; }\n' },
    { code: 'export function Img() { return <img role="presentation" />; }\n' },
    { code: 'export function Img() { return <img alt="" aria-hidden="true" />; }\n' },
    { code: 'export function Img() { return <img alt="" role="presentation" />; }\n' },
    { code: 'export function Img() { return <img alt={altText} />; }\n' },
    { code: 'export function Img() { return <img alt={0} />; }\n' },
    { code: 'export function Img() { return <div />; }\n' },
  ],
  invalid: [
    { code: 'export function Img() { return <img />; }\n', errors: [{ messageId: "a11yImgAlt" }] },
  ],
});
