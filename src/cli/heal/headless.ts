import { resolve } from "node:path";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { STAGES } from "@/cli/commands/pipeline.js";
import { readContext } from "@/cli/manifest/mutate.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { emitLine, readLastPacket, writeEscalationReport, noopStream } from "@/cli/commands/heal-helpers.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { loadConfig, loadPackets } from "@/cli/heal/config.js";
import { isPathAllowed } from "@/cli/heal/scope.js";
import { callModel } from "@/cli/heal/model.js";
import { commitAndPush, postPrComment } from "@/cli/heal/git.js";
import type { HeadlessOptions, PacketRef, PipelineReport } from "@/cli/heal/types.js";

async function defaultRunPipeline(cwd: string): Promise<PipelineReport> {
  const config = await loadConfig(cwd);
  const stages = config.pipeline.e2eOn === "never" ? STAGES.filter((s) => s.name !== "e2e") : STAGES;
  const report = await runPipeline(cwd, stages, { out: noopStream() });
  return { result: report.result, packetFile: report.packetFile };
}

export async function headlessHeal(options: HeadlessOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  if (config.ci?.headlessHeal?.enabled === false) {
    emitLine(options.out, { ok: true, skipped: true, reason: "ci.headlessHeal.enabled is false" });
    return;
  }
  const endpoint = process.env.AXIOM_HEAL_MODEL_ENDPOINT;
  if (!endpoint) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-I001", "Missing AXIOM_HEAL_MODEL_ENDPOINT", ["I-11"])),
      ExitCode.INTERNAL_ERROR
    );
  }
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const runPipelineImpl = options.runPipeline ?? defaultRunPipeline;
  const context = await readContext(cwd);
  let packets = await loadPackets(cwd);
  if (packets.length === 0) {
    emitLine(options.out, { ok: true, healedAtAttempt: 0, reason: "no fix packets" });
    return;
  }
  const maxRetries = options.maxRetries ?? config.budgets.maxRetries;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let applied = 0;
    for (const { packet } of packets) {
      const patches = await callModel(endpoint, packet, fetchImpl);
      for (const patch of patches) {
        if (!isPathAllowed(patch.file, context)) {
          emitLine(options.out, { ok: false, warning: `Patch target ${patch.file} is outside the allowed scope` });
          continue;
        }
        await writeTextFile(resolve(cwd, patch.file), patch.content);
        applied++;
      }
    }
    await commitAndPush(cwd, attempt);
    const report = await runPipelineImpl(cwd);
    if (report.result === "GREEN") {
      emitLine(options.out, { ok: true, healedAtAttempt: attempt });
      return;
    }
    if (report.packetFile !== null) {
      const nextPacket = await readLastPacket(resolve(cwd, report.packetFile));
      packets = [{ file: report.packetFile, packet: nextPacket }];
    } else {
      packets = [];
    }
  }

  const last = packets.at(-1);
  if (last === undefined) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-I001", "Headless heal exhausted retries with no fix packet", ["I-11"])),
      ExitCode.INTERNAL_ERROR
    );
  }
  const reportPath = resolve(cwd, "pipeline", "reports", `escalation_headless_${last.packet.runId}.json`);
  await writeEscalationReport(reportPath, last.packet.runId, last.packet, maxRetries);
  const body = `ESCALATION_REPORT\nrunId: ${last.packet.runId}\nerrorCode: ${last.packet.errorCode}\nreport: ${reportPath}`;
  await postPrComment(body, fetchImpl);
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-I001", `Headless heal failed after ${maxRetries} attempts`, ["I-11"])),
    ExitCode.INTERNAL_ERROR
  );
}
