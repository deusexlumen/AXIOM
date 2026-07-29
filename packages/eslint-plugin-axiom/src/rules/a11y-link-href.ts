import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";
import { findJsxAttribute, getJsxAttr, getJsxElementName } from "@/utils/jsx.js";
import { hasAccessibleText, hasJsxAttributeWithValue } from "@/utils/jsx-a11y.js";

export const a11yLinkHref = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce A003: links must have href and accessible text" },
    schema: [],
    messages: {
      a11yLinkHref: "A003: Anchor element must have an href and accessible link text.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      JSXElement(node): void {
        if (getJsxElementName(node) !== "a") return;
        const role = getJsxAttr(node, "role");
        const hasHref = findJsxAttribute(node, "href") !== null;
        if (!hasHref) {
          if (role === null || role === "link") {
            context.report({ node, messageId: "a11yLinkHref" });
          }
          return;
        }
        if (hasJsxAttributeWithValue(node, "aria-label")) return;
        if (hasJsxAttributeWithValue(node, "aria-labelledby")) return;
        if (hasJsxAttributeWithValue(node, "title")) return;
        if (hasAccessibleText(node)) return;
        context.report({ node, messageId: "a11yLinkHref" });
      },
    };
  },
});
