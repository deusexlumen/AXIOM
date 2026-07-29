import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";
import { findJsxAttribute, getJsxAttributeValue, getJsxElementName } from "@/utils/jsx.js";

export const a11yImgAlt = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce A001: images must have an accessible text alternative or be marked decorative" },
    schema: [],
    messages: {
      a11yImgAlt: "A001: Image element must have an alt prop or be marked decorative via aria-hidden/presentation.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      JSXElement(node): void {
        if (getJsxElementName(node) !== "img") return;
        if (findJsxAttribute(node, "alt") !== null) return;
        const ariaHidden = findJsxAttribute(node, "aria-hidden");
        const role = findJsxAttribute(node, "role");
        const ariaHiddenValue = ariaHidden === null ? null : getJsxAttributeValue(ariaHidden);
        const roleValue = role === null ? null : getJsxAttributeValue(role);
        const isDecorative =
          (ariaHiddenValue !== null && ariaHiddenValue.trim() === "true") ||
          (roleValue !== null && roleValue.trim() === "presentation");
        if (isDecorative) return;
        context.report({ node, messageId: "a11yImgAlt" });
      },
    };
  },
});
