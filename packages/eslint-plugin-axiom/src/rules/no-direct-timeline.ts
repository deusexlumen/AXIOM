import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const noDirectTimeline = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce N002: GSAP timelines must be created via useChoreo" },
    schema: [],
    messages: {
      noDirectTimeline: "N002: Direct gsap.timeline() is forbidden outside src/core/*. Use useChoreo().",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const filename = (context.filename ?? "").replace(/^file:\/\//, "").replace(/\\/g, "/");
    if (/src\/core\//.test(filename)) {
      return {};
    }
    return {
      CallExpression(node): void {
        const callee = node.callee;
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "gsap" &&
          callee.property.type === "Identifier" &&
          callee.property.name === "timeline"
        ) {
          context.report({ node: callee.property, messageId: "noDirectTimeline" });
        }
      },
    };
  },
});
