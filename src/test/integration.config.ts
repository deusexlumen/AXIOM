import { execSync } from "node:child_process";

export default function integrationSetup(): void {
  execSync("pnpm build", { cwd: process.cwd(), stdio: "ignore" });
  execSync("pnpm --filter eslint-plugin-axiom build", { cwd: process.cwd(), stdio: "ignore" });
}
