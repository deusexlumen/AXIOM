import { RuleTester } from "eslint";
import { noBarrel } from "@/rules/no-barrel.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-barrel", noBarrel, {
  valid: [
    { code: "export function f() {}\n" },
    { code: "import { x } from './x';\nexport function f() { return x; }\n" },
  ],
  invalid: [
    { code: "export { a } from './a';\nexport { b } from './b';\n", errors: [{ messageId: "noBarrel" }] },
    { code: "export * from './a';\n", errors: [{ messageId: "noBarrel" }] },
  ],
});
