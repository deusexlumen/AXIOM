import { execSync } from "node:child_process";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { recordDbState } from "@/cli/commands/db-helpers.js";

export async function migrateGen(): Promise<void> {
  const cwd = process.cwd();
  execSync("pnpm exec drizzle-kit generate", { cwd, stdio: "ignore" });
  const context = await readContext(cwd);
  const files = await recordDbState(cwd, context);
  await writeContext(cwd, context);
  result({ ok: true, generated: files });
}
