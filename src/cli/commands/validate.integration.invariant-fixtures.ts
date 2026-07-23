export type ValidateFixture = {
  code: string;
  inv: string;
  file: string;
  content: string;
  helpers?: Array<[string, string]>;
};

export const invariantFixtures: ValidateFixture[] = [
  {
    code: "AXM-V001",
    inv: "I-01",
    file: "src/components/V001.tsx",
    content: `${Array.from({ length: 130 }, (_, i) => `const a${i} = ${i};`).join("\n")}\nexport function V001() { return <div data-axm-id="V001" />; }\n`,
  },
  { code: "AXM-V004", inv: "I-04", file: "src/components/V004.tsx", content: "export default function V004() { return <div />; }\n" },
  {
    code: "AXM-V005",
    inv: "I-05",
    file: "src/components/V005.tsx",
    content: 'export { Helper } from "./V005Helper";\n',
    helpers: [["src/components/V005Helper.tsx", "export function Helper() { return <div />; }\n"]],
  },
  {
    code: "AXM-V006",
    inv: "I-06",
    file: "src/components/V006.tsx",
    content: 'import { Helper } from "./V006Helper";\nexport function V006() { return <Helper data-axm-id="V006" />; }\n',
    helpers: [["src/components/V006Helper.tsx", "export function Helper() { return <div />; }\n"]],
  },
  {
    code: "AXM-V008",
    inv: "I-08",
    file: "src/components/V008.tsx",
    content: 'export function V008() { return <div data-axm-id="V008" style={{ color: "#ff0000" }} />; }\n',
  },
  {
    code: "AXM-V009",
    inv: "I-09",
    file: "src/components/V009.tsx",
    content: "export function V009() {\n  // @ts-ignore\n  return <div data-axm-id=\"V009\" />;\n}\n",
  },
  {
    code: "AXM-V012",
    inv: "I-12",
    file: "src/components/V012.tsx",
    content: 'export function V012() {\n  const dynamicPath = "./V012Helper";\n  void import(dynamicPath);\n  return <div data-axm-id="V012" />;\n}\n',
    helpers: [["src/components/V012Helper.tsx", "export function V012Helper() { return <div />; }\n"]],
  },
];
