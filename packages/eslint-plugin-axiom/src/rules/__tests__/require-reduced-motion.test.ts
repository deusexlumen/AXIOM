import { RuleTester } from "eslint";
import { requireReducedMotion } from "@/rules/require-reduced-motion.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("require-reduced-motion", requireReducedMotion, {
  valid: [
    {
      code: "const { timeline } = useChoreo({ id: 'hero', reducedMotion: 'opacity-only' });",
      filename: "src/components/Hero.tsx",
    },
    {
      code: "const { timeline } = useChoreo({ id: 'hero', reducedMotion: { strategy: 'instant' } });",
      filename: "src/components/Hero.tsx",
    },
  ],
  invalid: [
    {
      code: "const { timeline } = useChoreo({ id: 'hero' });",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "requireReducedMotion" }],
    },
    {
      code: "const { timeline } = useChoreo();",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "requireReducedMotion" }],
    },
  ],
});
