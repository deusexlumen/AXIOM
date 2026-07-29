import type { Rule } from "eslint";
import { createRule } from "@/utils/create-rule.js";
import { basename, extname } from "node:path";

type JSXElement = Rule.Node & { openingElement: Rule.Node & { attributes: Rule.Node[] } };

function nodeType(node: Rule.Node): string {
  return (node as { type: string }).type;
}

function nameFromFile(filename: string): string | null {
  if (extname(filename) !== ".tsx") return null;
  if (!/(?:^|[/\\])src[/\\]components[/\\]/.test(filename)) return null;
  return basename(filename, ".tsx") || null;
}

function findRootJsx(body: Rule.Node): JSXElement | null {
  let target: Rule.Node | null = body;
  if (nodeType(body) === "BlockStatement") {
    target = null;
    for (const statement of (body as never as { body: Rule.Node[] }).body) {
      if (nodeType(statement) === "ReturnStatement") {
        target = (statement as never as { argument: Rule.Node | null }).argument;
        break;
      }
    }
  }
  if (target !== null && nodeType(target) === "JSXElement") {
    return target as never as JSXElement;
  }
  return null;
}

function getDataAxmId(attr: Rule.Node): string | null {
  if (nodeType(attr) !== "JSXAttribute") return null;
  const jsxAttr = attr as never as { name: Rule.Node & { name: string }; value: Rule.Node | null };
  if (nodeType(jsxAttr.name) !== "JSXIdentifier" || jsxAttr.name.name !== "data-axm-id") return null;
  const value = jsxAttr.value;
  if (value === null) return null;
  if (nodeType(value) === "Literal") return String((value as never as { value: unknown }).value);
  if (nodeType(value) === "JSXExpressionContainer") {
    const expression = (value as never as { expression: Rule.Node }).expression;
    if (nodeType(expression) === "Literal") return String((expression as never as { value: unknown }).value);
  }
  return null;
}

export const requireAxmId = createRule({
  meta: {
    type: "problem",
    docs: { description: "Enforce I-13: data-axm-id on component root" },
    schema: [],
    messages: { missingAxmId: "I-13: Root element must render data-axm-id=\"{{name}}\"." },
  },
  create(context: Rule.RuleContext): Rule.NodeListener {
    const expectedName = nameFromFile(context.filename);
    if (expectedName === null) return {};

    function checkComponent(name: string, body: Rule.Node, reportNode: Rule.Node): void {
      if (name !== expectedName) return;
      const root = findRootJsx(body);
      if (root === null) {
        context.report({ node: reportNode, messageId: "missingAxmId", data: { name: expectedName } });
        return;
      }
      for (const attr of root.openingElement.attributes) {
        if (getDataAxmId(attr) === expectedName) return;
      }
      context.report({ node: root.openingElement, messageId: "missingAxmId", data: { name: expectedName } });
    }

    return {
      ExportNamedDeclaration(node: Rule.Node): void {
        const declaration = (node as never as { declaration: Rule.Node | null }).declaration;
        if (declaration === null) return;
        if (nodeType(declaration) === "FunctionDeclaration") {
          const id = (declaration as never as { id: { name: string } | null }).id;
          if (id !== null) checkComponent(id.name, (declaration as never as { body: Rule.Node }).body, declaration);
          return;
        }
        if (nodeType(declaration) === "VariableDeclaration") {
          for (const declarator of (declaration as never as { declarations: Rule.Node[] }).declarations) {
            if (nodeType(declarator) !== "VariableDeclarator") continue;
            const init = (declarator as never as { init: Rule.Node | null }).init;
            const id = (declarator as never as { id: Rule.Node }).id;
            if (init !== null && nodeType(id) === "Identifier" && (nodeType(init) === "ArrowFunctionExpression" || nodeType(init) === "FunctionExpression")) {
              checkComponent((id as never as { name: string }).name, (init as never as { body: Rule.Node }).body, init);
            }
          }
        }
      },
    };
  },
});
