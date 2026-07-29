import { RuleTester } from "eslint";
import * as parser from "@typescript-eslint/parser";
import { noEscapeHatch } from "@/rules/no-escape-hatch.js";

const tester = new RuleTester({
  languageOptions: {
    parser: parser as never,
    parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  },
});

tester.run("no-escape-hatch", noEscapeHatch, {
  valid: [
    { code: "const x: number = 1;\n" },
    { code: "// normal comment\nexport const x = 1;\n" },
  ],
  invalid: [
    { code: "const x: any = 1;\n", errors: [{ messageId: "noEscapeHatch" }] },
    { code: "function f(x: any) { return x; }\n", errors: [{ messageId: "noEscapeHatch" }] },
    { code: "// @ts-ignore\nexport const x = 1;\n", errors: [{ messageId: "noEscapeHatch" }] },
    { code: "// eslint-disable-next-line\nexport const x = 1;\n", errors: [{ messageId: "noEscapeHatch" }] },
  ],
});
