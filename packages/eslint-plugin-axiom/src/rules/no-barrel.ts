import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const noBarrel = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-05: no barrel files" },
    schema: [],
    messages: { noBarrel: "I-05: Barrel re-exports are forbidden. Import directly from the source file." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    let reported = false;
    function reportOnce(node: Rule.Node): void {
      if (reported) return;
      reported = true;
      context.report({ node, messageId: "noBarrel" });
    }
    return {
      ExportAllDeclaration(node): void {
        reportOnce(node);
      },
      ExportNamedDeclaration(node): void {
        if (node.source !== null && node.source !== undefined && node.source.value !== "") {
          reportOnce(node);
        }
      },
    };
  },
});
