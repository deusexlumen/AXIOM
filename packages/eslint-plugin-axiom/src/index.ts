import { maxLoc } from "@/rules/max-loc.js";
import { noDefaultExport } from "@/rules/no-default-export.js";
import { noBarrel } from "@/rules/no-barrel.js";
import { absoluteImports } from "@/rules/absolute-imports.js";
import { tokensOnly } from "@/rules/tokens-only.js";
import { noEscapeHatch } from "@/rules/no-escape-hatch.js";
import { staticImports } from "@/rules/static-imports.js";

const plugin = {
  meta: {
    name: "eslint-plugin-axiom",
    version: "1.0.0",
  },
  rules: {
    "max-loc": maxLoc,
    "no-default-export": noDefaultExport,
    "no-barrel": noBarrel,
    "absolute-imports": absoluteImports,
    "tokens-only": tokensOnly,
    "no-escape-hatch": noEscapeHatch,
    "static-imports": staticImports,
  },
};

export default plugin;
