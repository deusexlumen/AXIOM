import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

const FORBIDDEN = new Set([
  "gsap",
  "three",
  "@react-three/fiber",
  "@react-three/drei",
]);

function isForbidden(source: string): string | undefined {
  for (const name of FORBIDDEN) {
    if (source === name || source.startsWith(`${name}/`)) {
      return name;
    }
  }
  return undefined;
}

export const noRawMotionEngine = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-18: no raw GSAP/Three imports outside core wrappers" },
    schema: [],
    messages: {
      noRawMotionEngine:
        "I-18: Direct import of {{name}} is forbidden outside src/core/* wrappers. Use useChoreo or Stage.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const filename = context.filename ?? "";
    const normalized = filename.replace(/\\/g, "/");
    if (/src\/core\//.test(normalized)) {
      return {};
    }
    return {
      ImportDeclaration(node): void {
        const source = node.source.value;
        if (typeof source !== "string") return;
        const name = isForbidden(source);
        if (name === undefined) return;
        context.report({
          node: node.source,
          messageId: "noRawMotionEngine",
          data: { name },
        });
      },
    };
  },
});
