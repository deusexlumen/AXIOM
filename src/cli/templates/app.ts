import type { AppFile } from "@/cli/templates/types.js";
import { packageJson } from "@/cli/templates/package-json.js";
import { npmrc } from "@/cli/templates/npmrc.js";
import { tsConfigJson } from "@/cli/templates/tsconfig-json.js";
import { nextConfigTs } from "@/cli/templates/next-config.js";
import { eslintConfigJs } from "@/cli/templates/eslint-config.js";
import { vitestConfigTs } from "@/cli/templates/vitest-config.js";
import { axiomConfigJson, tokensJson } from "@/cli/templates/manifest.js";
import { layoutTsx, pageTsx, globalsCss } from "@/cli/templates/app-router.js";
import {
  stageTsx,
  quadMeshTsx,
  useChoreoTs,
  lenisTs,
  errorBoundaryTsx,
} from "@/cli/templates/core-atelier.js";
import { axmSelectTs } from "@/cli/templates/playwright-helpers.js";
import { quadFragGlsl, glslDts } from "@/cli/templates/shader.js";
import { motionAxmJson } from "@/cli/templates/motion.js";
import { directionAxmJson } from "@/cli/templates/direction.js";
import { smokeSpecTs } from "@/cli/templates/e2e/smoke.spec.js";
import { reducedMotionSpecTs } from "@/cli/templates/e2e/reduced-motion.spec.js";
import { playwrightConfigTs } from "@/cli/templates/playwright-config.js";
import { ciWorkflowYaml } from "@/cli/templates/ci-workflow.js";
import { gitignore } from "@/cli/templates/gitignore.js";

export function gitkeepTemplate(): string {
  return "";
}

export function appFiles(projectName: string): AppFile[] {
  const config = JSON.parse(axiomConfigJson()) as {
    ci?: { headlessHeal?: { enabled?: boolean } };
  };
  const headlessHealEnabled = config.ci?.headlessHeal?.enabled ?? false;

  return [
    { path: ".github/workflows/axiom.yml", content: ciWorkflowYaml({ headlessHealEnabled }) },
    { path: "package.json", content: packageJson(projectName) },
    { path: ".npmrc", content: npmrc() },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "next.config.ts", content: nextConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "vitest.config.ts", content: vitestConfigTs() },
    { path: "playwright.config.ts", content: playwrightConfigTs() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "tokens.json", content: tokensJson() },
    { path: "MOTION.axm.json", content: motionAxmJson() },
    { path: "DIRECTION.axm.json", content: directionAxmJson() },
    { path: "app/layout.tsx", content: layoutTsx(projectName) },
    { path: "app/page.tsx", content: pageTsx() },
    { path: "app/globals.css", content: globalsCss() },
    { path: "src/core/Stage.tsx", content: stageTsx() },
    { path: "src/core/QuadMesh.tsx", content: quadMeshTsx() },
    { path: "src/core/useChoreo.ts", content: useChoreoTs() },
    { path: "src/core/lenis.ts", content: lenisTs() },
    { path: "src/core/error-boundary.tsx", content: errorBoundaryTsx() },
    { path: "src/core/axm-select.ts", content: axmSelectTs() },
    { path: "src/shaders/quad.frag.glsl", content: quadFragGlsl() },
    { path: "src/types/glsl.d.ts", content: glslDts() },
    { path: "src/components/.gitkeep", content: gitkeepTemplate() },
    { path: "src/state/.gitkeep", content: gitkeepTemplate() },
    { path: ".axiom/.gitkeep", content: gitkeepTemplate() },
    { path: "orders/done/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/.gitkeep", content: gitkeepTemplate() },
    { path: "pipeline/bench/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/decisions.ndjson", content: gitkeepTemplate() },
    { path: "pipeline/bench/cost.ndjson", content: gitkeepTemplate() },
    { path: "e2e/.gitkeep", content: gitkeepTemplate() },
    { path: "e2e/smoke.spec.ts", content: smokeSpecTs() },
    { path: "e2e/reduced-motion.spec.ts", content: reducedMotionSpecTs() },
    { path: ".gitignore", content: gitignore() },
  ];
}
