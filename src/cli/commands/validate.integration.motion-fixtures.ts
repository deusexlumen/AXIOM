import type { ValidateFixture } from "@/cli/commands/validate.integration.invariant-fixtures.js";

export const motionFixtures: ValidateFixture[] = [
  {
    code: "AXM-N001",
    inv: "I-18",
    file: "src/components/N001.tsx",
    content:
      'import { gsap } from "@/core/gsap";\nexport function N001() {\n  gsap.to(null, { duration: 0.7 });\n  return <div data-axm-id="N001" />;\n}\n',
    helpers: [["src/core/gsap.ts", 'import gsap from "gsap";\nexport { gsap };\n']],
  },
  {
    code: "AXM-N002",
    inv: "I-18",
    file: "src/components/N002.tsx",
    content:
      'import { gsap } from "@/core/gsap";\nexport function N002() {\n  gsap.timeline();\n  return <div data-axm-id="N002" />;\n}\n',
    helpers: [["src/core/gsap.ts", 'import gsap from "gsap";\nexport { gsap };\n']],
  },
  {
    code: "AXM-N003",
    inv: "I-18",
    file: "src/components/N003.tsx",
    content:
      'import { useChoreo } from "@/core/useChoreo";\nexport function N003() {\n  useChoreo({ id: "a", reducedMotion: "instant" });\n  useChoreo({ id: "b", reducedMotion: "instant" });\n  useChoreo({ id: "c", reducedMotion: "instant" });\n  useChoreo({ id: "d", reducedMotion: "instant" });\n  return <div data-axm-id="N003" />;\n}\n',
  },
  {
    code: "AXM-N004",
    inv: "I-19",
    file: "src/components/N004.tsx",
    content:
      'import { useChoreo } from "@/core/useChoreo";\nexport function N004() {\n  useChoreo({ id: "x" });\n  return <div data-axm-id="N004" />;\n}\n',
  },
  {
    code: "AXM-I018",
    inv: "I-18",
    file: "src/components/I018.tsx",
    content: 'import gsap from "gsap";\nexport function I018() {\n  void gsap;\n  return <div data-axm-id="I018" />;\n}\n',
  },
];
