export const RULE_MAP_INVARIANTS: Record<
  string,
  { code: string; invariants: string[]; fixHint: string; cause: string }
> = {
  "axiom/max-loc": {
    code: "AXM-V001",
    invariants: ["I-01"],
    fixHint: "Split the file using 'axm split' or extract helpers.",
    cause: "Component file exceeds the maximum allowed lines of code.",
  },
  "axiom/no-default-export": {
    code: "AXM-V004",
    invariants: ["I-04"],
    fixHint: "Convert the default export to a named export.",
    cause: "Component file uses a forbidden default export.",
  },
  "axiom/no-barrel": {
    code: "AXM-V005",
    invariants: ["I-05"],
    fixHint: "Import directly from the source file instead of re-exporting.",
    cause: "Component file is a barrel file.",
  },
  "axiom/absolute-imports": {
    code: "AXM-V006",
    invariants: ["I-06"],
    fixHint: "Replace the relative import with the @/ alias.",
    cause: "Component file uses a relative import.",
  },
  "axiom/tokens-only": {
    code: "AXM-V008",
    invariants: ["I-08"],
    fixHint: "Replace raw values with token references.",
    cause: "Component file contains raw colors or pixel values.",
  },
  "axiom/no-escape-hatch": {
    code: "AXM-V009",
    invariants: ["I-09"],
    fixHint: "Remove the escape hatch and type the code correctly.",
    cause: "Component file uses any, @ts-ignore, or eslint-disable.",
  },
  "axiom/static-imports": {
    code: "AXM-V012",
    invariants: ["I-12"],
    fixHint: "Use a static import with a literal module specifier.",
    cause: "Component file uses a dynamic import with a variable path.",
  },
  "axiom/require-axm-id": {
    code: "AXM-E002",
    invariants: ["I-13"],
    fixHint: "Add data-axm-id=\"<ComponentName>\" to the root JSX element.",
    cause: "Component root element does not render the required data-axm-id attribute.",
  },
};
