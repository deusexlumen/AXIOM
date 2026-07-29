import type { ContractRoute } from "@/cli/schemas/contract.js";

export function handlerStub(contractName: string, routeKey: string, route: ContractRoute): string {
  const routeName = `${contractName}.${routeKey}`;
  return `import type { HandlerFor } from "@/api/generated/handler-types";

export function ${routeKey}Handler(
  input: HandlerFor<"${routeName}">["input"]
): Promise<HandlerFor<"${routeName}">["output"]> {
  // TODO: implement ${route.method} ${route.path}
  throw new Error("Not implemented: ${routeName}");
}
`;
}
