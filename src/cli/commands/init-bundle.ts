import { mkdir, cp, rm } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";

export async function bundleEslintPlugin(targetDir: string, cliRoot: string): Promise<void> {
  const pluginSource = resolve(cliRoot, "packages/eslint-plugin-axiom");
  const pluginTarget = resolve(targetDir, "packages/eslint-plugin-axiom");
  await rm(pluginTarget, { recursive: true, force: true });
  await cp(pluginSource, pluginTarget, {
    recursive: true,
    filter: (source) => !source.includes("node_modules"),
  });
}

export async function bundleCliPackage(targetDir: string, cliRoot: string): Promise<void> {
  const cliTarget = resolve(targetDir, "packages", "axiom-cli");
  await rm(cliTarget, { recursive: true, force: true });
  await mkdir(cliTarget, { recursive: true });

  const cliPackageJson = resolve(cliRoot, "package.json");
  if (existsSync(cliPackageJson)) {
    await cp(cliPackageJson, resolve(cliTarget, "package.json"));
  }

  const cliDist = resolve(cliRoot, "dist");
  if (existsSync(cliDist)) {
    await cp(cliDist, resolve(cliTarget, "dist"), {
      recursive: true,
      filter: (source) => {
        const base = basename(source);
        if (base === "dist") return true;
        if (base.startsWith("__")) return false;
        if (base.endsWith(".test.js") || base.endsWith(".test.d.ts")) return false;
        if (base.endsWith(".d.ts") || base.endsWith(".d.ts.map") || base.endsWith(".js.map")) return false;
        return statSync(source).isDirectory() || base.endsWith(".js");
      },
    });
  }
}
