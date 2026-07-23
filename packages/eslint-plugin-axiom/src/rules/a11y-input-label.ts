import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";
import { getJsxAttrNonEmpty, getJsxElementName } from "@/utils/jsx.js";
import { findDescendantInputs, hasJsxAttributeWithValue } from "@/utils/jsx-a11y.js";

const INPUTS = new Set(["input", "textarea", "select"]);

export const a11yInputLabel = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce A004: form inputs must have an accessible label" },
    schema: [],
    messages: {
      a11yInputLabel: "A004: Form input must have an accessible label via htmlFor/id or aria-label/aria-labelledby.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const htmlForIds = new Set<string>();
    const labeledInputs = new Set<Rule.Node>();
    const inputs: Rule.Node[] = [];
    return {
      JSXElement(node): void {
        const name = getJsxElementName(node);
        if (name === "label") {
          const value = getJsxAttrNonEmpty(node, "htmlFor");
          if (value !== null) htmlForIds.add(value);
          for (const input of findDescendantInputs(node)) {
            labeledInputs.add(input);
          }
          return;
        }
        if (name !== null && INPUTS.has(name)) {
          inputs.push(node);
        }
      },
      "Program:exit"(): void {
        for (const input of inputs) {
          if (hasJsxAttributeWithValue(input, "aria-label")) continue;
          if (hasJsxAttributeWithValue(input, "aria-labelledby")) continue;
          if (labeledInputs.has(input)) continue;
          const id = getJsxAttrNonEmpty(input, "id");
          if (id !== null && htmlForIds.has(id)) continue;
          context.report({ node: input, messageId: "a11yInputLabel" });
        }
      },
    };
  },
});
