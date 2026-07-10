export interface CiWorkflowOptions {
  headlessHealEnabled: boolean;
}

const HEADLESS_BLOCK = `  headless-heal:
    runs-on: ubuntu-24.04
    needs: pipeline
    if: failure() && github.event_name == 'pull_request'
    permissions:
      contents: write
      pull-requests: write
    env:
      AXIOM_HEAL_MODEL_ENDPOINT: \${{ secrets.AXIOM_HEAL_MODEL_ENDPOINT }}
      AXIOM_HEADLESS_COMMIT_AND_PUSH: "1"
      GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm axm heal --headless
`;

function commentBlock(block: string): string {
  return block
    .split("\n")
    .map((line) => (line === "" ? "#" : `# ${line}`))
    .join("\n");
}

export function ciWorkflowYaml(options: CiWorkflowOptions): string {
  const headlessBlock = options.headlessHealEnabled ? HEADLESS_BLOCK : commentBlock(HEADLESS_BLOCK);
  return `# .github/workflows/axiom.yml — MACHINE ZONE
name: axiom
on: [push, pull_request]
jobs:
  pipeline:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm axm audit
      - run: pnpm axm validate
      - run: pnpm axm pipeline run
      - name: Upload FIX_PACKETs on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with: { name: fix-packets, path: pipeline/fix-packets/ }
${headlessBlock}`;
}
