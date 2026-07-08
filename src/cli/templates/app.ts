import type { AppFile } from "@/cli/templates/types.js";
import {
  packageJson,
  tsConfigJson,
  viteConfigTs,
  eslintConfigJs,
  vitestConfigTs,
} from "@/cli/templates/config.js";
import { axiomConfigJson, agentContextJson, tokensJson } from "@/cli/templates/manifest.js";
import { cursorRules, claudeMd } from "@/cli/templates/docs.js";
import { routerTs, errorBoundaryTsx, tokenProviderTsx } from "@/cli/templates/core.js";
import { stylesCss, themeCss } from "@/cli/templates/generated.js";
import { mainTsx, appTsx, appTestTsx, indexHtml } from "@/cli/templates/app-entry.js";
import { gitignore } from "@/cli/templates/gitignore.js";

export { type AppFile } from "@/cli/templates/types.js";

export function appFiles(projectName: string): AppFile[] {
  return [
    { path: "package.json", content: packageJson(projectName) },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "vite.config.ts", content: viteConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "vitest.config.ts", content: vitestConfigTs() },
    { path: "src/styles.css", content: stylesCss() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "agent-context.json", content: agentContextJson(projectName) },
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
    { path: "index.html", content: indexHtml(projectName) },
    { path: ".gitignore", content: gitignore() },
  ];
}
