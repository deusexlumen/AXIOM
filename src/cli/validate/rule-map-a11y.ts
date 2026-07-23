export const RULE_MAP_A11Y: Record<
  string,
  { code: string; invariants: string[]; fixHint: string; cause: string }
> = {
  "axiom/a11y-img-alt": {
    code: "AXM-A001",
    invariants: ["I-13"],
    fixHint: "Add a descriptive alt prop, or use aria-hidden/presentation for decorative images.",
    cause: "Image element lacks an accessible text alternative.",
  },
  "axiom/a11y-button-label": {
    code: "AXM-A002",
    invariants: ["I-13"],
    fixHint: "Add visible text, aria-label, aria-labelledby, or title to the button.",
    cause: "Button element has no accessible name.",
  },
  "axiom/a11y-link-href": {
    code: "AXM-A003",
    invariants: ["I-13"],
    fixHint: "Add a valid href and accessible text to the link.",
    cause: "Anchor element lacks href or accessible link text.",
  },
  "axiom/a11y-input-label": {
    code: "AXM-A004",
    invariants: ["I-13"],
    fixHint: "Associate the input with a label via htmlFor/id or add aria-label/aria-labelledby.",
    cause: "Form input lacks an accessible label.",
  },
};
