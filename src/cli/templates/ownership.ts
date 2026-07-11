export interface Ownership {
  locked: string[];
  machine: string[];
}

export function ownershipFiles(): Ownership {
  return {
    locked: ["src/core/router.ts", "src/core/error-boundary.tsx", "src/core/token-provider.tsx", "src/core/axm-select.ts", "src/core/QuadMesh.tsx", "axiom.config.json"],
    machine: [
      "src/generated/theme.css",
      "src/generated/route-manifest.tsx",
      ".cursorrules",
      "CLAUDE.md",
      "agent-context.json",
      ".axiom/leases.json",
      "drizzle.config.ts",
      "db/client.ts",
      "ledger/decisions.ndjson",
      "pipeline/bench/cost.ndjson",
      ".github/workflows/axiom.yml",
    ],
  };
}
