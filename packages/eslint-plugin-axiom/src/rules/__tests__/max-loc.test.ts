import { RuleTester } from "eslint";
import { maxLoc } from "../max-loc.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("max-loc", maxLoc, {
  valid: [
    { code: "export function f() { return 1; }\n", options: [{ max: 3 }] },
  ],
  invalid: [
    {
      code: "export function f() {\n  const a = 1;\n  const b = 2;\n  const c = 3;\n  const d = 4;\n  return a + b + c + d;\n}\n",
      options: [{ max: 3 }],
      errors: [{ messageId: "exceedsMaxLoc" }],
    },
  ],
});
