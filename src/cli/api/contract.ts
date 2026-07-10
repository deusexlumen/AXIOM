import { hashString } from "@/cli/manifest/hash.js";
import type { ContractDefinition } from "@/cli/schemas/contract.js";

type StableRoute = {
  method: string;
  path: string;
  errors: Record<string, string>;
};

type StableContract = {
  name: string;
  routes: Record<string, StableRoute>;
};

function buildStableContract(contract: ContractDefinition): StableContract {
  const routes: Record<string, StableRoute> = {};
  for (const key of Object.keys(contract.routes).sort()) {
    const route = contract.routes[key]!;
    const errors: Record<string, string> = {};
    const codes = Object.keys(route.errors).map(Number).sort((a, b) => a - b);
    for (const code of codes) {
      errors[String(code)] = route.errors[code]!;
    }
    routes[key] = { method: route.method, path: route.path, errors };
  }
  return { name: contract.name, routes };
}

export function defineContract(def: ContractDefinition): ContractDefinition {
  return def;
}

export function contractHash(contract: ContractDefinition): string {
  return hashString(JSON.stringify(buildStableContract(contract)));
}

export function routeNames(contract: ContractDefinition): string[] {
  return Object.keys(contract.routes).map((key) => `${contract.name}.${key}`);
}
