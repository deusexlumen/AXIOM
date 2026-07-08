import type { AppFile } from "@/cli/templates/types.js";
import { packageJson } from "@/cli/templates/package-json.js";
import { tsConfigJson } from "@/cli/templates/tsconfig-json.js";
import { viteConfigTs } from "@/cli/templates/vite-config.js";
import { eslintConfigJs } from "@/cli/templates/eslint-config.js";
import { vitestConfigTs } from "@/cli/templates/vitest-config.js";
import { axiomConfigJson, tokensJson } from "@/cli/templates/manifest.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { routerTs, errorBoundaryTsx, tokenProviderTsx } from "@/cli/templates/core.js";
import { stylesCss, themeCss } from "@/cli/templates/generated.js";
import { mainTsx, appTsx, appTestTsx, indexHtml } from "@/cli/templates/app-entry.js";
import { gitignore } from "@/cli/templates/gitignore.js";

export interface Ownership {
  locked: string[];
  machine: string[];
}

export function gitkeepTemplate(): string {
  return "";
}

export function ownershipFiles(): Ownership {
  return {
    locked: ["src/core/router.ts", "src/core/error-boundary.tsx", "src/core/token-provider.tsx", "axiom.config.json"],
    machine: ["src/generated/theme.css", ".cursorrules", "CLAUDE.md", "agent-context.json"],
  };
}

export function appFiles(projectName: string): AppFile[] {
  return [
    { path: "package.json", content: packageJson(projectName) },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "vite.config.ts", content: viteConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "vitest.config.ts", content: vitestConfigTs() },
    { path: "src/styles.css", content: stylesCss() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "tokens.json", content: tokensJson() },
    { path: ".cursorrules", content: cursorRules() },
    { path: "CLAUDE.md", content: claudeMd() },
    { path: "src/core/router.ts", content: routerTs() },
    { path: "src/core/error-boundary.tsx", content: errorBoundaryTsx() },
    { path: "src/core/token-provider.tsx", content: tokenProviderTsx() },
    { path: "src/generated/theme.css", content: themeCss() },
    { path: "src/main.tsx", content: mainTsx() },
    { path: "src/App.tsx", content: appTsx() },
    { path: "src/App.test.tsx", content: appTestTsx() },
    { path: "src/components/.gitkeep", content: gitkeepTemplate() },
    { path: "src/routes/.gitkeep", content: gitkeepTemplate() },
    { path: "src/state/.gitkeep", content: gitkeepTemplate() },
    { path: "e2e/.gitkeep", content: gitkeepTemplate() },
    { path: "index.html", content: indexHtml(projectName) },
    { path: ".gitignore", content: gitignore() },
  ];
}
