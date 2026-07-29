import { RuleTester } from "eslint";
import { noDirectTimeline } from "@/rules/no-direct-timeline.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("no-direct-timeline", noDirectTimeline, {
  valid: [
    {
      code: "const tl = useChoreo().timeline;",
      filename: "src/components/Hero.tsx",
    },
    {
      code: "gsap.timeline();",
      filename: "src/core/useChoreo.ts",
    },
  ],
  invalid: [
    {
      code: "const tl = gsap.timeline();",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "noDirectTimeline" }],
    },
  ],
});
