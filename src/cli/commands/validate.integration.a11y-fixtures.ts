import type { ValidateFixture } from "@/cli/commands/validate.integration.invariant-fixtures.js";

export const a11yFixtures: ValidateFixture[] = [
  { code: "AXM-E002", inv: "I-13", file: "src/components/V013.tsx", content: "export function V013() { return <div />; }\n" },
  {
    code: "AXM-A001",
    inv: "I-13",
    file: "src/components/A001.tsx",
    content: 'export function A001() { return <img src="/x.png" data-axm-id="A001" />; }\n',
  },
  {
    code: "AXM-A002",
    inv: "I-13",
    file: "src/components/A002.tsx",
    content: 'export function A002() { return <button data-axm-id="A002" />; }\n',
  },
  {
    code: "AXM-A003",
    inv: "I-13",
    file: "src/components/A003.tsx",
    content: 'export function A003() { return <a data-axm-id="A003" />; }\n',
  },
  {
    code: "AXM-A004",
    inv: "I-13",
    file: "src/components/A004.tsx",
    content: 'export function A004() { return <input data-axm-id="A004" />; }\n',
  },
];
