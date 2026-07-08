import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

const HEX_COLOR = /#[0-9A-Fa-f]{3,8}\b/;
const RGB_RGBA = /rgba?\s*\(/;
const HSL_HSLA = /hsla?\s*\(/;
const NAMED_COLOR = /\b(?:red|green|blue|yellow|orange|purple|pink|black|white|gray|grey|cyan|magenta|lime|olive|teal|navy|maroon)\b/i;
const ARBITRARY_VALUE = /\[\s*\d+\s*(?:px|rem|em|vh|vw)?\s*\]/;

export const tokensOnly = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-08: no raw colors or pixel values; token references only" },
    schema: [],
    messages: {
      rawValue: "I-08: Raw color or pixel value detected. Use a token reference instead.",
      arbitraryValue: "I-08: Tailwind arbitrary value detected. Use a token class instead.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    function checkLiteral(node: { value?: unknown }): void {
      const value = node.value;
      if (typeof value !== "string") return;
      if (HEX_COLOR.test(value) || RGB_RGBA.test(value) || HSL_HSLA.test(value) || NAMED_COLOR.test(value)) {
        context.report({ node: node as never, messageId: "rawValue" });
      }
      if (ARBITRARY_VALUE.test(value)) {
        context.report({ node: node as never, messageId: "arbitraryValue" });
      }
    }
    return {
      Literal(node): void { checkLiteral(node); },
      JSXText(node): void { checkLiteral(node as never); },
      TemplateElement(node): void {
        if (node.value.cooked !== null) {
          checkLiteral({ value: node.value.cooked });
        }
      },
    };
  },
});
