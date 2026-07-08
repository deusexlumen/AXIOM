import { RuleTester } from "eslint";
import { noDefaultExport } from "@/rules/no-default-export.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-default-export", noDefaultExport, {
  valid: [
    { code: "export function f() {}\n" },
    { code: "export const x = 1;\n" },
  ],
  invalid: [
    { code: "export default function f() {}\n", errors: [{ messageId: "noDefaultExport" }] },
    { code: "const x = 1;\nexport default x;\n", errors: [{ messageId: "noDefaultExport" }] },
  ],
});
