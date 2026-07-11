export interface Ownership {
  locked: string[];
  machine: string[];
}

export function ownershipFiles(): Ownership {
  return {
    locked: [
      "src/core/Stage.tsx",
      "src/core/QuadMesh.tsx",
      "src/core/useChoreo.ts",
      "src/core/lenis.ts",
      "src/core/error-boundary.tsx",
      "src/core/axm-select.ts",
      "axiom.config.json",
    ],
    machine: [
      "app/*",
      "src/generated/*",
      "next.config.ts",
      "src/shaders/quad.frag.glsl",
      "src/types/glsl.d.ts",
      ".cursorrules",
      "CLAUDE.md",
      "agent-context.json",
      ".axiom/leases.json",
      "ledger/decisions.ndjson",
      "pipeline/bench/cost.ndjson",
      ".github/workflows/axiom.yml",
    ],
  };
}
