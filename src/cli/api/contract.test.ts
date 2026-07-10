import { describe, it, expect } from "vitest";
import { z } from "zod/v3";
import { defineContract, contractHash, routeNames } from "@/cli/api/contract.js";
import type { ContractDefinition } from "@/cli/schemas/contract.js";

function makeContract(overrides: Partial<ContractDefinition> = {}): ContractDefinition {
  return {
    name: "tasks",
    routes: {
      list: {
        method: "GET",
        path: "/tasks",
        input: z.object({}),
        output: z.array(z.string()),
        errors: { 404: "Not found" },
      },
      create: {
        method: "POST",
        path: "/tasks",
        input: z.object({ title: z.string() }),
        output: z.object({ id: z.string() }),
        errors: { 400: "Bad request" },
      },
    },
    ...overrides,
  };
}

describe("defineContract", () => {
  it("returns the same object", () => {
    const contract = makeContract();
    expect(defineContract(contract)).toBe(contract);
  });
});

describe("contractHash", () => {
  it("is deterministic across identical contracts", () => {
    const a = makeContract();
    const b = makeContract();
    expect(contractHash(a)).toBe(contractHash(b));
  });

  it("changes when name changes", () => {
    const base = contractHash(makeContract());
    expect(contractHash(makeContract({ name: "other" }))).not.toBe(base);
  });

  it("changes when path changes", () => {
    const base = contractHash(makeContract());
    const changed = makeContract();
    changed.routes.list!.path = "/other";
    expect(contractHash(changed)).not.toBe(base);
  });

  it("changes when method changes", () => {
    const base = contractHash(makeContract());
    const changed = makeContract();
    changed.routes.list!.method = "POST";
    expect(contractHash(changed)).not.toBe(base);
  });

  it("changes when errors change", () => {
    const base = contractHash(makeContract());
    const changed = makeContract();
    changed.routes.list!.errors = { 500: "Server error" };
    expect(contractHash(changed)).not.toBe(base);
  });
});

describe("routeNames", () => {
  it("returns fully qualified route names", () => {
    expect(routeNames(makeContract())).toEqual(["tasks.list", "tasks.create"]);
  });
});
