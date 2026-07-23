import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const absoluteImports = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-06: imports only via @/ alias or bare/module specifiers" },
    schema: [],
    messages: { noRelativeImport: "I-06: Relative imports are forbidden. Use the @/ alias." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      ImportDeclaration(node): void {
        const source = node.source.value;
        if (typeof source !== "string") return;
        if (source.startsWith("./") || source.startsWith("../")) {
          if (/\.(?:css|scss|sass|less|styl|glsl|vert|frag)$/i.test(source)) return;
          context.report({ node: node.source, messageId: "noRelativeImport" });
        }
      },
    };
  },
});
