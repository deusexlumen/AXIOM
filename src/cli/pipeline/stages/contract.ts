import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { readAgentContext } from "@/cli/manifest/reader.js";
import { hashString } from "@/cli/manifest/hash.js";
import { loadContract } from "@/cli/commands/api-helpers.js";
import { contractHash } from "@/cli/api/contract.js";
import { buildPipelinePacket } from "@/cli/pipeline/packet.js";
import type { StageResult } from "@/cli/pipeline/types.js";
import type { EndpointEntry } from "@/cli/schemas/agent-context.js";
import { findRawFetch, handlerRouteName, handlerUsesType } from "@/cli/pipeline/stages/contract-helpers.js";

const CLIENT_PATH = "src/generated/api-client.ts";

function contractPacket(message: string, file: string, code: string, invariant: string): StageResult {
  return {
    ok: false,
    packet: buildPipelinePacket(code, message, file, 1, 1, "contract", [invariant]),
  };
}

export async function runContractStage(cwd: string): Promise<StageResult> {
  const context = await readAgentContext(cwd);
  const endpoints = context.endpoints ?? [];
  const machine = context.integrity.machineFiles;

  for (const ep of endpoints) {
    try {
      await readFile(resolve(cwd, ep.contract));
    } catch {
      return contractPacket(`Missing contract file for endpoint ${ep.name}`, ep.handler, "AXM-C001", "I-14");
    }
  }

  const rawFetch = await findRawFetch(cwd, ["src/components", "src/state"]);
  if (rawFetch !== undefined) {
    return contractPacket(`Raw fetch found in ${rawFetch}`, rawFetch, "AXM-C002", "I-15");
  }

  for (const ep of endpoints) {
    const contract = await loadContract(resolve(cwd, ep.contract)).catch(() => null);
    if (!contract) {
      return contractPacket(`Contract drift or invalid contract for ${ep.name}`, ep.contract, "AXM-C004", "I-14");
    }
    const expected = machine[ep.contract];
    if (expected && contractHash(contract) !== expected) {
      return contractPacket(`Contract drift for ${ep.name}`, ep.contract, "AXM-C004", "I-14");
    }
  }

  if (endpoints.length > 0) {
    const clientContent = await readFile(resolve(cwd, CLIENT_PATH), "utf-8").catch(() => "");
    if (!clientContent) {
      return contractPacket("Missing generated API client", CLIENT_PATH, "AXM-C004", "I-14");
    }
    const expectedClient = machine[CLIENT_PATH];
    if (expectedClient && hashString(clientContent) !== expectedClient) {
      return contractPacket("Generated API client is out of sync", CLIENT_PATH, "AXM-C004", "I-14");
    }
  }

  for (const ep of endpoints) {
    const content = await readFile(resolve(cwd, ep.handler), "utf-8").catch(() => "");
    const routeName = handlerRouteName(ep.handler, ep.name);
    if (routeName === undefined || !handlerUsesType(content, routeName)) {
      return contractPacket(`Handler signature drift for ${ep.name}`, ep.handler, "AXM-C003", "I-14");
    }
  }

  return { ok: true };
}
