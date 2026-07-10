import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { result } from "@/cli/utils/ndjson.js";
import { buildSigIndex, writeSigIndex } from "@/cli/context/sig-index.js";
import { logPacketCost } from "@/cli/ledger/cost.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import type { Stage, PipelineOptions, PipelineReport, StageName } from "@/cli/pipeline/types.js";

export async function runPipeline(
  cwd: string,
  stages: Stage[],
  options: PipelineOptions = {}
): Promise<PipelineReport> {
  const runId = `run_${Date.now()}`;
  const report: PipelineReport = {
    runId,
    result: "GREEN",
    failedStage: null,
    packetFile: null,
  };
  const packetDir = resolve(cwd, "pipeline", "fix-packets");
  await mkdir(packetDir, { recursive: true });

  for (const stage of stages) {
    if (options.stage !== undefined && stage.name !== options.stage) continue;
    const stageResult = await stage.run(cwd, options.scope ? [options.scope] : undefined);
    if (!stageResult.ok) {
      report.result = "RED";
      report.failedStage = stage.name as StageName;
      if (stageResult.packet !== undefined) {
        const packetFile = `pipeline/fix-packets/${runId}.ndjson`;
        const packet = stageResult.packet as { packetId: string; orderId?: string };
        await appendPacket(resolve(cwd, packetFile), packet);
        report.packetFile = packetFile;
        const estimatedTokens = Math.ceil(JSON.stringify(packet).length / 4);
        await logPacketCost(cwd, packet.packetId, stage.name, estimatedTokens, packet.orderId);
      }
      break;
    }
  }

  result({ ok: report.result === "GREEN", report }, options.out);

  if (report.result === "GREEN") {
    try {
      const context = await readContext(cwd);
      const index = await buildSigIndex(cwd, context);
      await writeSigIndex(cwd, index);
      context.integrity.machineFiles[".axiom/sig-index.json"] = await hashFile(
        resolve(cwd, ".axiom/sig-index.json")
      );
      await writeContext(cwd, context);
    } catch {
      // Context not available; skip signature index update.
    }
  }

  return report;
}

async function appendPacket(path: string, packet: unknown): Promise<void> {
  await appendFile(path, `${JSON.stringify(packet)}\n`);
}
