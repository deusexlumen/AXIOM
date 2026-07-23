import { readdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");
const testDir = resolve(root, "src", "cli", "commands");
const files = readdirSync(testDir)
  .filter((f) => f.endsWith(".integration.test.ts"))
  .map((f) => `src/cli/commands/${f}`)
  .sort();

console.log(">>> Pre-building eslint-plugin-axiom");
execSync("pnpm --filter eslint-plugin-axiom build", { cwd: root, stdio: "inherit" });

let failed = 0;
for (const file of files) {
  console.log(`\n>>> Running ${file}`);
  const reportPath = resolve(root, "pipeline", "reports", `vitest-${file.replace(/[^a-zA-Z0-9]/g, "-")}.json`);
  const cmd = `pnpm vitest run --reporter=json --outputFile=${reportPath} --config vitest.integration.config.ts ${file}`;
  try {
    execSync(cmd, { cwd: root, stdio: "inherit", timeout: 300000 });
    console.log(`<<< PASS ${file}`);
  } catch {
    let passed = false;
    try {
      const report = JSON.parse(readFileSync(reportPath, "utf-8"));
      passed = report.success === true;
    } catch {
      passed = false;
    }
    if (passed) {
      console.log(`<<< PASS ${file} (report green despite process timeout)`);
    } else {
      console.log(`<<< FAIL ${file}`);
      failed++;
    }
  } finally {
    if (existsSync(reportPath)) {
      try {
        rmSync(reportPath);
      } catch {}
    }
  }
}

if (failed > 0) {
  console.log(`\n${failed} integration test file(s) failed.`);
  process.exit(1);
}
console.log("\nAll integration test files passed.");
