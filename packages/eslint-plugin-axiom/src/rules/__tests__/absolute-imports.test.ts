import { RuleTester } from "eslint";
import { absoluteImports } from "@/rules/absolute-imports.js";

const tester = new RuleTester({ languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } } });

tester.run("absolute-imports", absoluteImports, {
  valid: [
    { code: "import { x } from '@/x';\n" },
    { code: "import { x } from 'node:fs';\n" },
    { code: "import './styles.css';\n" },
  ],
  invalid: [
    { code: "import { x } from './x';\n", errors: [{ messageId: "noRelativeImport" }] },
    { code: "import { x } from '../x';\n", errors: [{ messageId: "noRelativeImport" }] },
  ],
});
