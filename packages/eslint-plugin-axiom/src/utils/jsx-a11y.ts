import type { Rule } from "eslint";
import {
  asJsxAttribute,
  asJsxElement,
  findJsxAttribute,
  getJsxElementName,
  nodeType,
  type JSXExpressionContainer,
  type JSXText,
  type LiteralNode,
} from "@/utils/jsx.js";

export function hasJsxAttributeWithValue(node: Rule.Node, attrName: string): boolean {
  const attr = findJsxAttribute(node, attrName);
  if (attr === null) return false;
  const value = asJsxAttribute(attr).value;
  if (value === null) return false;
  if (nodeType(value) === "Literal") {
    const val = (value as unknown as LiteralNode).value;
    return val !== null && val !== undefined && val !== false && String(val).trim().length > 0;
  }
  if (nodeType(value) === "JSXExpressionContainer") {
    const expr = (value as unknown as JSXExpressionContainer).expression;
    if (nodeType(expr) === "Literal") {
      const val = (expr as unknown as LiteralNode).value;
      return val !== null && val !== undefined && val !== false && String(val).trim().length > 0;
    }
    return nodeType(expr) !== "JSXEmptyExpression";
  }
  return true;
}

export function hasAccessibleText(node: Rule.Node): boolean {
  if (nodeType(node) !== "JSXElement") return false;
  for (const child of asJsxElement(node).children) {
    if (nodeType(child) === "JSXText") {
      if ((child as unknown as JSXText).value.trim().length > 0) return true;
      continue;
    }
    if (nodeType(child) === "JSXExpressionContainer") {
      const expr = (child as unknown as JSXExpressionContainer).expression;
      const t = nodeType(expr);
      if (t === "Identifier" || t === "MemberExpression" || t === "CallExpression" || t === "ConditionalExpression") return true;
      if (t === "Literal") {
        const val = (expr as unknown as LiteralNode).value;
        if (val !== null && val !== undefined && val !== false && String(val).trim().length > 0) return true;
      }
      continue;
    }
    if (nodeType(child) === "JSXElement" && hasAccessibleText(child)) return true;
  }
  return false;
}

export function findDescendantInputs(node: Rule.Node): Rule.Node[] {
  if (nodeType(node) !== "JSXElement") return [];
  const found: Rule.Node[] = [];
  function walk(current: Rule.Node): void {
    if (nodeType(current) !== "JSXElement") return;
    const name = getJsxElementName(current);
    if (name !== null && (name === "input" || name === "textarea" || name === "select")) {
      found.push(current);
      return;
    }
    for (const child of asJsxElement(current).children) {
      walk(child);
    }
  }
  walk(node);
  return found;
}
