import { RuleTester } from "eslint";
import { noRawMotionEngine } from "@/rules/no-raw-motion-engine.js";

const tester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: "module" } },
});

tester.run("no-raw-motion-engine", noRawMotionEngine, {
  valid: [
    { code: "import { useChoreo } from '@/core/useChoreo';\n", filename: "src/components/Hero.tsx" },
    { code: "import gsap from 'gsap';\n", filename: "src/core/useChoreo.ts" },
    { code: "import { Canvas } from '@react-three/fiber';\n", filename: "src/core/Stage.tsx" },
    { code: "import * as THREE from 'three';\n", filename: "src/core/Stage.tsx" },
  ],
  invalid: [
    {
      code: "import gsap from 'gsap';\n",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
    {
      code: "import { Canvas } from '@react-three/fiber';\n",
      filename: "src/components/Scene.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
    {
      code: "import { ScrollTrigger } from 'gsap/ScrollTrigger';\n",
      filename: "src/components/Hero.tsx",
      errors: [{ messageId: "noRawMotionEngine" }],
    },
  ],
});
