import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

const ESCAPE_PATTERNS = [
  { pattern: /@ts-ignore/, label: "@ts-ignore" },
  { pattern: /@ts-expect-error/, label: "@ts-expect-error" },
  { pattern: /eslint-disable/, label: "eslint-disable" },
];

export const noEscapeHatch = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-09: no any, @ts-ignore, or eslint-disable" },
    schema: [],
    messages: { noEscapeHatch: "I-09: Escape hatch '{{label}}' is forbidden. Remove it." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      Identifier(node): void {
        if (node.name === "any") {
          context.report({ node, messageId: "noEscapeHatch", data: { label: "any" } });
        }
      },
      "TSAnyKeyword"(node: Rule.Node): void {
        context.report({ node, messageId: "noEscapeHatch", data: { label: "any" } });
      },
      Program(): void {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        for (const comment of sourceCode.getAllComments()) {
          for (const { pattern, label } of ESCAPE_PATTERNS) {
            if (pattern.test(comment.value)) {
              context.report({ node: comment as never, messageId: "noEscapeHatch", data: { label } });
            }
          }
        }
      },
    };
  },
});
