import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { AgentContext } from "@/cli/schemas/agent-context.js";

const statusArbitrary = fc.constantFrom("GREEN", "RED", "STALE", "ORPHAN");

const componentArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
  spec: fc.string({ minLength: 1, maxLength: 40 }),
  test: fc.string({ minLength: 1, maxLength: 40 }),
  exports: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 3 }),
  dependsOn: fc.array(fc.string({ minLength: 1, maxLength: 40 }), { maxLength: 3 }),
  usedBy: fc.array(fc.string({ minLength: 1, maxLength: 40 }), { maxLength: 3 }),
  loc: fc.integer({ min: 0, max: 120 }),
  bytes: fc.integer({ min: 0, max: 4096 }),
  status: statusArbitrary,
  specHash: fc.string({ minLength: 10, maxLength: 70 }),
  lastPipelineRun: fc.option(
    fc
      .integer({ min: Date.parse("2000-01-01T00:00:00.000Z"), max: Date.parse("2099-12-31T23:59:59.999Z") })
      .map((ts) => new Date(ts).toISOString()),
    { nil: undefined }
  ),
});

const routeArbitrary = fc.record({
  path: fc.string({ minLength: 1, maxLength: 20 }),
  component: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
});

const storeArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  file: fc.string({ minLength: 1, maxLength: 40 }),
  shapeHash: fc.string({ minLength: 10, maxLength: 70 }),
});

const contextArbitrary = fc.record({
  axiomVersion: fc.constant("1.0.0"),
  project: fc.record({
    name: fc.string({ minLength: 1, maxLength: 20 }),
    tokenBudget: fc.record({
      hardLimitPerSlice: fc.integer({ min: 1000, max: 32000 }),
      warnAt: fc.integer({ min: 500, max: 16000 }),
    }),
  }),
  components: fc.array(componentArbitrary, { maxLength: 5 }),
  routes: fc.array(routeArbitrary, { maxLength: 5 }),
  stores: fc.array(storeArbitrary, { maxLength: 3 }),
  tokens: fc.record({
    file: fc.constant("tokens.json"),
    hash: fc.string({ minLength: 10, maxLength: 70 }),
  }),
  integrity: fc.record({
    lockedFiles: fc.dictionary(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 10, maxLength: 70 })),
    machineFiles: fc.dictionary(fc.string({ minLength: 1, maxLength: 40 }), fc.string({ minLength: 10, maxLength: 70 })),
  }),
  pipeline: fc.record({
    lastRun: fc.option(
      fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        result: statusArbitrary,
        failedStage: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
      }),
      { nil: null }
    ),
  }),
});

describe("AgentContext schema property tests", () => {
  it("accepts 1.000 random valid manifest mutations", () => {
    fc.assert(
      fc.property(contextArbitrary, (raw) => {
        const parsed = AgentContext.safeParse(raw);
        expect(parsed.success).toBe(true);
      }),
      { numRuns: 1000 }
    );
  });
});
