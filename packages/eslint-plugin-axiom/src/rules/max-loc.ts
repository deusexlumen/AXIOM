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
        const comments = sourceCode
          .getAllComments()
          .filter((comment) => comment.loc !== null && comment.loc !== undefined)
          .map((comment) => comment.loc);

        function isCodeLine(lineIndex: number): boolean {
          const lineNumber = lineIndex + 1;
          const lineText = lines[lineIndex];
          if (lineText === undefined) return false;
          let cleaned = lineText;
          for (const loc of comments) {
            if (loc === null || loc === undefined) continue;
            if (loc.end.line < lineNumber || loc.start.line > lineNumber) continue;
            const startOffset = loc.start.line === lineNumber ? Math.max(0, loc.start.column - 1) : 0;
            const endOffset = loc.end.line === lineNumber ? Math.max(startOffset, loc.end.column - 1) : lineText.length;
            cleaned = cleaned.slice(0, startOffset) + " ".repeat(endOffset - startOffset) + cleaned.slice(endOffset);
          }
          return cleaned.trim().length > 0;
        }

        let loc = 0;
        for (let i = 0; i < lines.length; i += 1) {
          if (isCodeLine(i)) loc += 1;
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
