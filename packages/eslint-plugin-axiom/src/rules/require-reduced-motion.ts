import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const requireReducedMotion = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce N004: every useChoreo call declares a reduced-motion path" },
    schema: [],
    messages: {
      requireReducedMotion: "N004: useChoreo() must declare reducedMotion option (e.g. 'opacity-only' or 'instant').",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    return {
      CallExpression(node): void {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "useChoreo") return;
        const arg = node.arguments[0];
        if (!arg || arg.type !== "ObjectExpression") {
          context.report({ node: callee, messageId: "requireReducedMotion" });
          return;
        }
        const hasReducedMotion = arg.properties.some(
          (prop) =>
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            prop.key.name === "reducedMotion"
        );
        if (!hasReducedMotion) {
          context.report({ node: callee, messageId: "requireReducedMotion" });
        }
      },
    };
  },
});
