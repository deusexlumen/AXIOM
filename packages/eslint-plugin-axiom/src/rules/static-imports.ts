import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const staticImports = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-12: no dynamic imports with variable paths" },
    schema: [],
    messages: { noDynamicImport: "I-12: Dynamic imports with variable paths are forbidden." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ImportExpression(node): void {
        if (node.source.type !== "Literal") {
          context.report({ node: node.source, messageId: "noDynamicImport" });
        }
      },
    };
  },
});
