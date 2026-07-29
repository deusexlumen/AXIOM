import { RuleTester } from "eslint";
import { motionTokenUsage } from "@/rules/motion-token-usage.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("motion-token-usage", motionTokenUsage, {
  valid: [
    {
      code: "import motion from '@/generated/motion'; gsap.to(el, { duration: motion.dur.ui, ease: motion.ease.snap });",
      filename: "src/components/Hero.tsx",
    },
    {
      code: "import { motion } from '@/generated/motion'; gsap.from(el, { duration: motion.dur.reveal, ease: motion.ease.hero });",
      filename: "src/components/Hero.tsx",
    },
    {
      code: "import motion from '@/generated/motion'; gsap.to(el, { duration: motion.dur.micro, ease: motion.ease.snap });",
      filename: "src/core/useChoreo.ts",
    },
  ],
  invalid: [
    {
      code: "gsap.to(el, { duration: 0.7, ease: 'power2.out' });",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "motionTokenDuration" }, { messageId: "motionTokenEase" }],
    },
    {
      code: "gsap.fromTo(el, { opacity: 0 }, { duration: 1.2, ease: 'power2.out' });",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "motionTokenDuration" }, { messageId: "motionTokenEase" }],
    },
  ],
});
