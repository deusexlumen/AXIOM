import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";
import { getJsxElementName } from "@/utils/jsx.js";
import { hasAccessibleText, hasJsxAttributeWithValue } from "@/utils/jsx-a11y.js";

export const a11yButtonLabel = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce A002: buttons must have an accessible name" },
    schema: [],
    messages: {
      a11yButtonLabel: "A002: Button element must have an accessible name (text, aria-label, aria-labelledby, or title).",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      JSXElement(node): void {
        if (getJsxElementName(node) !== "button") return;
        if (hasJsxAttributeWithValue(node, "aria-label")) return;
        if (hasJsxAttributeWithValue(node, "aria-labelledby")) return;
        if (hasJsxAttributeWithValue(node, "title")) return;
        if (hasAccessibleText(node)) return;
        context.report({ node, messageId: "a11yButtonLabel" });
      },
    };
  },
});
