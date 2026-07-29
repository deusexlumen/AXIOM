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
      "src/generated/theme.css",
      "src/generated/motion.ts",
      "next.config.ts",
      "app/layout.tsx",
      "app/page.tsx",
      "app/contact/page.tsx",
      "app/globals.css",
      "src/schemas/contact.ts",
      "api/contracts/contact.contract.ts",
      "api/handlers/contact.create.ts",
      "api/generated/handler-types.ts",
      "src/generated/api-client.ts",
      "api/generated/openapi.json",
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
