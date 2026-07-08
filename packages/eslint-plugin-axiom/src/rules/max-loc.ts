import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

interface Options {
  max?: number;
}

export const maxLoc = createRule({
  meta: {
    type: "problem",
    docs: {
      description: "Enforce I-01: max lines of code per file",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      exceedsMaxLoc: `I-01: File exceeds maximum allowed lines of code ({{max}}). Use 'axm split'.`,
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const options = (context.options[0] ?? {}) as Options;
    const max = options.max ?? 120;
    return {
      Program(node): void {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const lines = sourceCode.lines;
        const commentLines = new Set<number>();
        for (const comment of sourceCode.getAllComments()) {
          for (let i = comment.loc.start.line; i <= comment.loc.end.line; i += 1) {
            commentLines.add(i);
          }
        }
        let loc = 0;
        for (let i = 0; i < lines.length; i += 1) {
          const lineNumber = i + 1;
          const trimmed = lines[i]!.trim();
          if (trimmed.length === 0) continue;
          if (commentLines.has(lineNumber)) continue;
          loc += 1;
        }
        if (loc > max) {
          context.report({
            node,
            messageId: "exceedsMaxLoc",
            data: { max: String(max) },
          });
        }
      },
    };
  },
});
