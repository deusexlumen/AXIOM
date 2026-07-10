import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function axiomConfigJson(): string {
  return JSON.stringify(
    {
      budgets: { maxLocPerFile: 120, maxBytesPerFile: 4096, maxRetries: 3 },
      pipeline: {
        stages: ["validate", "contract", "typecheck", "lint", "unit", "e2e"],
        e2eOn: "route-change",
      },
      context: { sliceDepth: 2, signatureOnlyBeyondDepth: 1 },
      ci: { headlessHeal: { enabled: false } },
    },
    null,
    2
  );
}

export function initialAgentContext(name: string, tokenHash: string): AgentContext {
  return {
    axiomVersion: "1.0.0",
    project: {
      name,
      tokenBudget: { hardLimitPerSlice: 8000, warnAt: 6000 },
    },
    components: [],
    routes: [],
    stores: [],
    endpoints: [],
    db: { schemaFiles: [], migrationHead: null, migrationHashes: {} },
    tokens: { file: "tokens.json", hash: tokenHash },
    integrity: {
      lockedFiles: {},
      machineFiles: {
        "ledger/decisions.ndjson": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "pipeline/bench/cost.ndjson": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
    },
    pipeline: { lastRun: null },
    visions: [],
    orders: { open: 0, active: 0, done: 0, blocked: 0 },
  };
}

export function tokensJson(): string {
  return JSON.stringify(
    {
      color: {
        action: { primary: "#4F46E5", danger: "#DC2626" },
        surface: { base: "#0B0F19", raised: "#151B2B" },
        text: { primary: "#F5F7FA", muted: "#8A93A6" },
      },
      space: { "1": "4px", "2": "8px", "4": "16px", "8": "32px" },
      radius: { sm: "4px", md: "8px", full: "9999px" },
      font: { size: { sm: "14px", base: "16px", xl: "24px" } },
    },
    null,
    2
  );
}
