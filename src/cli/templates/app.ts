import type { AppFile } from "@/cli/templates/types.js";
import { packageJson } from "@/cli/templates/package-json.js";
import { npmrc } from "@/cli/templates/npmrc.js";
import { tsConfigJson } from "@/cli/templates/tsconfig-json.js";
import { viteConfigTs } from "@/cli/templates/vite-config.js";
import { eslintConfigJs } from "@/cli/templates/eslint-config.js";
import { vitestConfigTs } from "@/cli/templates/vitest-config.js";
import { axiomConfigJson, tokensJson } from "@/cli/templates/manifest.js";
import { routerTs, errorBoundaryTsx, tokenProviderTsx } from "@/cli/templates/core.js";
import { axmSelectTs } from "@/cli/templates/playwright-helpers.js";
import { stylesCss } from "@/cli/templates/generated.js";
import { mainTsx, appTsx, appTestTsx, indexHtml } from "@/cli/templates/app-entry.js";
import { gitignore } from "@/cli/templates/gitignore.js";
import { smokeSpecTs } from "@/cli/templates/e2e/smoke.spec.js";
import { playwrightConfigTs } from "@/cli/templates/playwright-config.js";
import { drizzleConfigTs } from "@/cli/templates/db/drizzle-config.js";
import { pgliteClientTs } from "@/cli/templates/db/client.js";

export interface Ownership {
  locked: string[];
  machine: string[];
}

export function gitkeepTemplate(): string {
  return "";
}

export function ownershipFiles(): Ownership {
  return {
    locked: ["src/core/router.ts", "src/core/error-boundary.tsx", "src/core/token-provider.tsx", "src/core/axm-select.ts", "axiom.config.json"],
    machine: ["src/generated/theme.css", "src/generated/route-manifest.tsx", ".cursorrules", "CLAUDE.md", "agent-context.json", ".axiom/leases.json", "drizzle.config.ts", "db/client.ts", "ledger/decisions.ndjson", "pipeline/bench/cost.ndjson"],
  };
}

export function appFiles(projectName: string): AppFile[] {
  return [
    { path: "package.json", content: packageJson(projectName) },
    { path: ".npmrc", content: npmrc() },
    { path: "tsconfig.json", content: tsConfigJson() },
    { path: "vite.config.ts", content: viteConfigTs() },
    { path: "eslint.config.js", content: eslintConfigJs() },
    { path: "vitest.config.ts", content: vitestConfigTs() },
    { path: "src/styles.css", content: stylesCss() },
    { path: "axiom.config.json", content: axiomConfigJson() },
    { path: "tokens.json", content: tokensJson() },
    { path: "src/core/router.ts", content: routerTs() },
    { path: "src/core/error-boundary.tsx", content: errorBoundaryTsx() },
    { path: "src/core/token-provider.tsx", content: tokenProviderTsx() },
    { path: "src/core/axm-select.ts", content: axmSelectTs() },
    { path: "src/main.tsx", content: mainTsx() },
    { path: "src/App.tsx", content: appTsx() },
    { path: "src/App.test.tsx", content: appTestTsx() },
    { path: "src/components/.gitkeep", content: gitkeepTemplate() },
    { path: "src/routes/.gitkeep", content: gitkeepTemplate() },
    { path: "src/state/.gitkeep", content: gitkeepTemplate() },
    { path: ".axiom/.gitkeep", content: gitkeepTemplate() },
    { path: "orders/done/.gitkeep", content: gitkeepTemplate() },
    { path: "api/contracts/.gitkeep", content: gitkeepTemplate() },
    { path: "api/handlers/.gitkeep", content: gitkeepTemplate() },
    { path: "api/generated/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/.gitkeep", content: gitkeepTemplate() },
    { path: "pipeline/bench/.gitkeep", content: gitkeepTemplate() },
    { path: "ledger/decisions.ndjson", content: gitkeepTemplate() },
    { path: "pipeline/bench/cost.ndjson", content: gitkeepTemplate() },
    { path: "drizzle.config.ts", content: drizzleConfigTs() },
    { path: "db/schema/.gitkeep", content: gitkeepTemplate() },
    { path: "db/migrations/.gitkeep", content: gitkeepTemplate() },
    { path: "db/client.ts", content: pgliteClientTs() },
    { path: "e2e/.gitkeep", content: gitkeepTemplate() },
    { path: "e2e/smoke.spec.ts", content: smokeSpecTs() },
    { path: "playwright.config.ts", content: playwrightConfigTs() },
    { path: "index.html", content: indexHtml(projectName) },
    { path: ".gitignore", content: gitignore() },
  ];
}
