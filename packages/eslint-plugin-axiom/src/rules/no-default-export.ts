import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const noDefaultExport = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-04: no default exports" },
    schema: [],
    messages: { noDefaultExport: "I-04: Default exports are forbidden. Use named exports only." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ExportDefaultDeclaration(node): void {
        context.report({ node, messageId: "noDefaultExport" });
      },
    };
  },
});
