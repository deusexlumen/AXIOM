import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";

const GSAP_METHODS = new Set(["to", "from", "fromTo", "timeline"]);

function isGsapCall(node: Rule.Node): boolean {
  if (node.type !== "CallExpression") return false;
  const callee = node.callee;
  if (callee.type === "MemberExpression" && callee.object.type === "Identifier" && callee.object.name === "gsap") {
    const prop = callee.property;
    if (prop.type === "Identifier" && GSAP_METHODS.has(prop.name)) return true;
  }
  return false;
}

function isMotionReference(node: Rule.Node | null | undefined, motionBindings: Set<string>): boolean {
  if (!node) return false;
  if (node.type === "MemberExpression") {
    const obj = node.object;
    if (obj.type === "Identifier" && motionBindings.has(obj.name)) return true;
  }
  return false;
}

function getOptionsArg(node: Rule.Node): Rule.Node | undefined {
  if (node.type !== "CallExpression") return undefined;
  const callee = node.callee;
  let index = 1;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier" && callee.property.name === "fromTo") {
    index = 2;
  }
  if (node.arguments.length <= index) return undefined;
  const arg = node.arguments[index];
  if (!arg || arg.type === "SpreadElement") return undefined;
  return arg as Rule.Node;
}

export const motionTokenUsage = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce N001: GSAP ease/duration must come from motion tokens" },
    schema: [],
    messages: {
      motionTokenEase: "N001: GSAP ease must be imported from @/generated/motion. Raw curve: {{value}}",
      motionTokenDuration: "N001: GSAP duration must be imported from @/generated/motion. Raw value: {{value}}",
    },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const motionBindings = new Set<string>();
    return {
      ImportDeclaration(node): void {
        const source = node.source.value;
        if (source !== "@/generated/motion") return;
        for (const spec of node.specifiers) {
          if (spec.type === "ImportDefaultSpecifier" || spec.type === "ImportSpecifier") {
            motionBindings.add(spec.local.name);
          }
        }
      },
      CallExpression(node): void {
        if (!isGsapCall(node)) return;
        const options = getOptionsArg(node);
        if (!options || options.type !== "ObjectExpression") return;
        for (const prop of options.properties) {
          if (prop.type !== "Property") continue;
          const key = prop.key;
          if (key.type !== "Identifier") continue;
          if (key.name === "ease" && prop.value.type === "Literal" && typeof prop.value.value === "string") {
            context.report({
              node: prop.value,
              messageId: "motionTokenEase",
              data: { value: prop.value.value },
            });
          }
          if (
            (key.name === "duration" || key.name === "dur") &&
            prop.value.type === "Literal" &&
            typeof prop.value.value === "number"
          ) {
            context.report({
              node: prop.value,
              messageId: "motionTokenDuration",
              data: { value: String(prop.value.value) },
            });
          }
        }
      },
    };
  },
});
