import { RuleTester } from "eslint";
import { maxConcurrentTimelines } from "@/rules/max-concurrent-timelines.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("max-concurrent-timelines", maxConcurrentTimelines, {
  valid: [
    {
      code: "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n",
      filename: "src/components/Hero.tsx",
    },
    {
      code:
        "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n" +
        "const b = useChoreo({ id: 'b', reducedMotion: 'instant' });\n" +
        "const c = useChoreo({ id: 'c', reducedMotion: 'instant' });\n",
      filename: "src/components/Hero.tsx",
    },
    {
      code:
        "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n" +
        "const b = useChoreo({ id: 'b', reducedMotion: 'instant' });\n" +
        "const c = useChoreo({ id: 'c', reducedMotion: 'instant' });\n" +
        "const d = useChoreo({ id: 'd', reducedMotion: 'instant' });\n",
      filename: "src/core/useChoreo.ts",
    },
    {
      code:
        "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n" +
        "const b = useChoreo({ id: 'b', reducedMotion: 'instant' });\n",
      options: [{ max: 2 }],
      filename: "src/components/Hero.tsx",
    },
  ],
  invalid: [
    {
      code:
        "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n" +
        "const b = useChoreo({ id: 'b', reducedMotion: 'instant' });\n" +
        "const c = useChoreo({ id: 'c', reducedMotion: 'instant' });\n" +
        "const d = useChoreo({ id: 'd', reducedMotion: 'instant' });\n",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "maxConcurrentTimelines" }],
    },
    {
      code:
        "const a = useChoreo({ id: 'a', reducedMotion: 'instant' });\n" +
        "const b = useChoreo({ id: 'b', reducedMotion: 'instant' });\n" +
        "const c = useChoreo({ id: 'c', reducedMotion: 'instant' });\n",
      options: [{ max: 1 }],
      filename: "src/components/Hero.tsx",
      errors: [
        { messageId: "maxConcurrentTimelines" },
        { messageId: "maxConcurrentTimelines" },
      ],
    },
  ],
});
