import { execSync } from "node:child_process";
import { emitLine } from "@/cli/commands/heal-helpers.js";

export async function commitAndPush(cwd: string, attempt: number): Promise<void> {
  if (process.env.AXIOM_HEADLESS_COMMIT_AND_PUSH !== "1") return;
  try {
    execSync(
      'git config --local user.name "AXIOM Bot" && git config --local user.email "axm@axiom.local"',
      { cwd, stdio: "ignore" }
    );
    execSync(
      'git add -A && git diff --cached --quiet || (git commit -m "chore: axm headless heal" --quiet && git push --quiet)',
      { cwd, stdio: "ignore" }
    );
  } catch {
    emitLine(undefined, { ok: false, warning: `Attempt ${attempt}: commit/push failed` });
  }
}

export async function postPrComment(body: string, fetchImpl: typeof fetch = globalThis.fetch): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const pr = process.env.GITHUB_PR_NUMBER;
  if (!token || !repo || !pr) return;
  const [owner, name] = repo.split("/");
  if (!owner || !name) return;
  await fetchImpl(`https://api.github.com/repos/${owner}/${name}/issues/${pr}/comments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}
