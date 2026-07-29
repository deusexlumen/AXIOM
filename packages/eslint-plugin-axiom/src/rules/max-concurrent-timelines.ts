import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

interface Options {
  max?: number;
}

export const maxConcurrentTimelines = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce N003: max concurrent useChoreo() calls per file" },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      maxConcurrentTimelines:
        "N003: Too many concurrent choreographies ({{count}}/{{max}}). Consolidate or split the component.",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const filename = (context.filename ?? "").replace(/^file:\/\//, "").replace(/\\/g, "/");
    if (/src\/core\//.test(filename)) {
      return {};
    }
    const options = (context.options[0] ?? {}) as Options;
    const max = options.max ?? 3;
    const calls: Rule.Node[] = [];
    return {
      CallExpression(node): void {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "useChoreo") {
          calls.push(node);
        }
      },
      "Program:exit"(): void {
        if (calls.length <= max) return;
        for (let i = max; i < calls.length; i += 1) {
          const call = calls[i];
          if (call === undefined) continue;
          context.report({
            node: call,
            messageId: "maxConcurrentTimelines",
            data: { count: String(calls.length), max: String(max) },
          });
        }
      },
    };
  },
});
