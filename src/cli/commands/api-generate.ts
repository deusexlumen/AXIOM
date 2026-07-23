import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { writeTextFile } from "@/cli/utils/fs.js";
import { hashString } from "@/cli/manifest/hash.js";
import { contractHash } from "@/cli/api/contract.js";
import { handlerStub } from "@/cli/templates/api/handler.js";
import { handlerTypesTs } from "@/cli/templates/api/handler-types.js";
import { clientTs } from "@/cli/templates/api/client.js";
import { openapiJson } from "@/cli/templates/api/openapi.js";
import {
  loadContract,
  contractFile,
  handlerFile,
  clientFile,
  handlerTypesFile,
  openapiFile,
  endpointEntries,
  toAgentEndpoint,
  uniqueContractNames,
} from "@/cli/commands/api-helpers.js";
import type { AgentContext } from "@/cli/schemas/agent-context.js";
import type { ContractDefinition } from "@/cli/schemas/contract.js";

export async function copyContract(source: string, dest: string): Promise<void> {
  await writeTextFile(dest, (await readFile(source, "utf-8")).replace(/\r\n/g, "\n"));
}

export async function generateHandlers(name: string, contract: ContractDefinition, cwd: string): Promise<void> {
  for (const [routeKey, route] of Object.entries(contract.routes)) {
    await writeTextFile(resolve(cwd, handlerFile(name, routeKey)), handlerStub(name, routeKey, route));
  }
}

export async function regenerateArtifacts(
  cwd: string,
  context: AgentContext,
  newContractName?: string,
  preloaded?: Record<string, ContractDefinition>
): Promise<void> {
  const names = uniqueContractNames(context.endpoints ?? []);
  if (newContractName && !names.includes(newContractName)) names.push(newContractName);
  const toLoad = names.filter((name) => !preloaded?.[name]);
  const contracts = { ...(await loadContracts(cwd, toLoad)), ...preloaded };
  const endpoints = names.flatMap((name) => endpointEntries(name, contracts[name]!));
  const handlerTypes = handlerTypesTs(names);
  const client = clientTs(endpoints);
  const openapi = openapiJson(names.map((name) => ({ name, contract: contracts[name]! })));
  const openapiText = `${JSON.stringify(openapi, null, 2)}\n`;
  await writeTextFile(resolve(cwd, handlerTypesFile()), handlerTypes);
  await writeTextFile(resolve(cwd, clientFile()), client);
  await writeTextFile(resolve(cwd, openapiFile()), openapiText);
  context.integrity.machineFiles[handlerTypesFile()] = hashString(handlerTypes);
  context.integrity.machineFiles[clientFile()] = hashString(client);
  context.integrity.machineFiles[openapiFile()] = hashString(openapiText);
  for (const name of names) {
    context.integrity.machineFiles[contractFile(name)] = contractHash(contracts[name]!);
  }
}

async function loadContracts(cwd: string, names: string[]): Promise<Record<string, ContractDefinition>> {
  const out: Record<string, ContractDefinition> = {};
  for (const name of names) {
    out[name] = await loadContract(resolve(cwd, contractFile(name)), cwd);
  }
  return out;
}

export function addEndpoints(context: AgentContext, name: string, contract: ContractDefinition): void {
  context.endpoints = context.endpoints?.filter((e) => e.name !== name) ?? [];
  context.endpoints.push(...endpointEntries(name, contract).map(toAgentEndpoint));
}

export function generatedFiles(name: string, contract: ContractDefinition): string[] {
  return [contractFile(name), ...Object.keys(contract.routes).map((k) => handlerFile(name, k)), handlerTypesFile(), clientFile(), openapiFile()];
}
