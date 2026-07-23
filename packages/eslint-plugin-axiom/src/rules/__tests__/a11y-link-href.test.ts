import { RuleTester } from "eslint";
import { a11yLinkHref } from "@/rules/a11y-link-href.js";

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  },
});

tester.run("a11y-link-href", a11yLinkHref, {
  valid: [
    { code: 'export function Lnk() { return <a href="/">Home</a>; }\n' },
    { code: 'export function Lnk() { return <a href="/" aria-label="Home" />; }\n' },
    { code: 'export function Lnk() { return <span role="button">Click</span>; }\n' },
    { code: 'export function Lnk() { return <a role="button">Click</a>; }\n' },
    { code: 'export function Lnk() { return <a href={hrefVar}>Home</a>; }\n' },
    { code: 'export function Lnk() { return <a href="/" aria-label={label} />; }\n' },
  ],
  invalid: [
    { code: 'export function Lnk() { return <a />; }\n', errors: [{ messageId: "a11yLinkHref" }] },
    { code: 'export function Lnk() { return <a>Home</a>; }\n', errors: [{ messageId: "a11yLinkHref" }] },
    { code: 'export function Lnk() { return <a href="/" />; }\n', errors: [{ messageId: "a11yLinkHref" }] },
    { code: 'export function Lnk() { return <a role="link" />; }\n', errors: [{ messageId: "a11yLinkHref" }] },
    { code: 'export function Lnk() { return <a href="/" aria-label="" />; }\n', errors: [{ messageId: "a11yLinkHref" }] },
    { code: 'export function Lnk() { return <a href="/" title={""} />; }\n', errors: [{ messageId: "a11yLinkHref" }] },
  ],
});
