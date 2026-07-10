import { register } from "tsx/esm/api";
import { pathToFileURL } from "node:url";
import { z } from "zod/v3";
import { ContractDefinition, HttpMethod } from "@/cli/schemas/contract.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import type { EndpointEntry } from "@/cli/schemas/agent-context.js";

type HttpMethodType = z.infer<typeof HttpMethod>;

export interface ApiEndpoint {
  contractName: string;
  routeKey: string;
  method: HttpMethodType;
  path: string;
  clientMethod: string;
}

export async function loadContract(path: string): Promise<ContractDefinition> {
  const unregister = register();
  try {
    const url = pathToFileURL(path).href;
    const mod = (await import(url)) as Record<string, unknown>;
    const exported = findContractExport(mod);
    return ContractDefinition.parse(exported);
  } finally {
    await unregister();
  }
}

function findContractExport(mod: Record<string, unknown>): unknown {
  const candidates = Object.values(mod).filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null
  );
  const contract = candidates.find(
    (v) => typeof v.name === "string" && typeof v.routes === "object" && v.routes !== null
  );
  if (!contract) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-C003", "Contract file must export a ContractDefinition object", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  return contract;
}

export function contractFile(name: string): string {
  return `api/contracts/${name}.contract.ts`;
}

export function handlerFile(name: string, routeKey: string): string {
  return `api/handlers/${name}.${routeKey}.ts`;
}

export function clientFile(): string {
  return "src/generated/api-client.ts";
}

export function handlerTypesFile(): string {
  return "api/generated/handler-types.ts";
}

export function openapiFile(): string {
  return "api/generated/openapi.json";
}

export function clientMethod(contractName: string, routeKey: string): string {
  return `${contractName}${capitalize(routeKey)}`;
}

export function endpointEntries(contractName: string, contract: ContractDefinition): ApiEndpoint[] {
  return Object.entries(contract.routes).map(([routeKey, route]) => ({
    contractName,
    routeKey,
    method: HttpMethod.parse(route.method),
    path: route.path,
    clientMethod: clientMethod(contractName, routeKey),
  }));
}

export function toAgentEndpoint(ep: ApiEndpoint): EndpointEntry {
  return {
    name: ep.contractName,
    method: ep.method,
    path: ep.path,
    contract: contractFile(ep.contractName),
    handler: handlerFile(ep.contractName, ep.routeKey),
    clientMethod: ep.clientMethod,
    status: "GREEN",
  };
}

export function uniqueContractNames(endpoints: ApiEndpoint[] | EndpointEntry[]): string[] {
  return [...new Set(endpoints.map((e) => ("contractName" in e ? e.contractName : e.name)))];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
