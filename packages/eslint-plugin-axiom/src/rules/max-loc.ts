import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

export const maxLoc = createRule({
  meta: {
    type: "problem",
    docs: { description: "AXIOM invariant rule stub" },
    schema: [],
    messages: {
      stub: "Stub: rule not yet implemented.",
    },
  },
  create(): Rule.NodeListener {
    return {};
  },
});
