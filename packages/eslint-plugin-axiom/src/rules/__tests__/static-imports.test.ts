import { RuleTester } from "eslint";
import { staticImports } from "@/rules/static-imports.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("static-imports", staticImports, {
  valid: [
    { code: "import { x } from '@/x';\n" },
    { code: "import x from '@/x';\n" },
  ],
  invalid: [
    { code: "const mod = './x';\nimport(mod);\n", errors: [{ messageId: "noDynamicImport" }] },
  ],
});
