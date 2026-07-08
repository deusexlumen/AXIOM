import { RuleTester } from "eslint";
import { noEscapeHatch } from "@/rules/no-escape-hatch.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("no-escape-hatch", noEscapeHatch, {
  valid: [
    { code: "const x = 1;\n" },
    { code: "// normal comment\nexport const x = 1;\n" },
  ],
  invalid: [
    { code: "const x = any;\n", errors: [{ messageId: "noEscapeHatch" }] },
    { code: "// @ts-ignore\nexport const x = 1;\n", errors: [{ messageId: "noEscapeHatch" }] },
    { code: "// eslint-disable-next-line\nexport const x = 1;\n", errors: [{ messageId: "noEscapeHatch" }] },
  ],
});
