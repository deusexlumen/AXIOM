import type { ContractDefinition } from "@/cli/schemas/contract.js";

export function openapiJson(contracts: { name: string; contract: ContractDefinition }[]): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const { name, contract } of contracts) {
    for (const [routeKey, route] of Object.entries(contract.routes)) {
      if (!paths[route.path]) paths[route.path] = {};
      const responses: Record<string, unknown> = {
        "200": {
          description: "Success",
          content: {
            "application/json": {
              schema: { type: "object", description: `${name}.${routeKey} output` },
            },
          },
        },
      };
      for (const [code, desc] of Object.entries(route.errors)) {
        responses[code] = { description: desc };
      }
      const op: Record<string, unknown> = {
        operationId: `${name}.${routeKey}`,
        summary: `${routeKey} on ${route.path}`,
        responses,
      };
      if (route.method !== "GET") {
        op.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", description: `${name}.${routeKey} input` },
            },
          },
        };
      }
      paths[route.path]![route.method.toLowerCase()] = op;
    }
  }
  return {
    openapi: "3.1.0",
    info: { title: "AXIOM API", version: "1.0.0" },
    paths,
  };
}
