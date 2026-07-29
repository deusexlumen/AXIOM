import type { Rule } from "eslint";

export interface LiteralNode {
  type: "Literal";
  value: unknown;
}

export interface JSXIdentifier {
  type: "JSXIdentifier";
  name: string;
}

export interface JSXText {
  type: "JSXText";
  value: string;
}

export interface JSXExpressionContainer {
  type: "JSXExpressionContainer";
  expression: Rule.Node;
}

export interface JSXAttribute {
  type: "JSXAttribute";
  name: JSXIdentifier | Rule.Node;
  value: Rule.Node | null;
}

export interface JSXOpeningElement {
  type: "JSXOpeningElement";
  name: JSXIdentifier | Rule.Node;
  attributes: Array<JSXAttribute | Rule.Node>;
}

export interface JSXElement {
  type: "JSXElement";
  openingElement: JSXOpeningElement;
  children: Rule.Node[];
}

export function nodeType(node: Rule.Node): string {
  return (node as { type: string }).type;
}

export function asJsxElement(node: Rule.Node): JSXElement {
  return node as unknown as JSXElement;
}

export function asJsxAttribute(node: Rule.Node): JSXAttribute {
  return node as unknown as JSXAttribute;
}

export function getJsxElementName(node: Rule.Node): string | null {
  if (nodeType(node) !== "JSXElement") return null;
  const name = asJsxElement(node).openingElement.name;
  if (name.type !== "JSXIdentifier") return null;
  return name.name;
}

export function findJsxAttribute(node: Rule.Node, attrName: string): Rule.Node | null {
  if (nodeType(node) !== "JSXElement") return null;
  for (const attr of asJsxElement(node).openingElement.attributes as Rule.Node[]) {
    if (nodeType(attr) !== "JSXAttribute") continue;
    const jsxAttr = asJsxAttribute(attr);
    const name = jsxAttr.name;
    if (name.type !== "JSXIdentifier") continue;
    if (name.name === attrName) return attr;
  }
  return null;
}

export function getJsxAttributeValue(node: Rule.Node): string | null {
  if (nodeType(node) !== "JSXAttribute") return null;
  const value = asJsxAttribute(node).value;
  if (value === null) return null;
  if (nodeType(value) === "Literal") return String((value as unknown as LiteralNode).value);
  if (nodeType(value) === "JSXExpressionContainer") {
    const expr = (value as unknown as JSXExpressionContainer).expression;
    if (nodeType(expr) === "Literal") return String((expr as unknown as LiteralNode).value);
  }
  return null;
}

export function getJsxAttr(node: Rule.Node, attrName: string): string | null {
  const attr = findJsxAttribute(node, attrName);
  return attr === null ? null : getJsxAttributeValue(attr);
}

export function getJsxAttrNonEmpty(node: Rule.Node, attrName: string): string | null {
  const value = getJsxAttr(node, attrName);
  return value !== null && value.trim().length > 0 ? value : null;
}
