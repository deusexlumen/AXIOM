import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { runPipeline } from "@/cli/pipeline/runner.js";
import { STAGES } from "@/cli/pipeline/select-stages.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { readLastPacket, writeEscalationReport, waitForAck, noopStream, emitLine } from "@/cli/commands/heal-helpers.js";
import { headlessHeal } from "@/cli/heal/headless.js";

export interface HealOptions {
  cwd?: string;
  maxRetries?: number;
  ackTimeoutMs?: number;
  out?: NodeJS.WritableStream;
  headless?: boolean;
}

export async function healCommand(options: HealOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  if (options.headless) {
    await headlessHeal({ cwd, maxRetries: options.maxRetries, out: options.out });
    return;
  }
  const maxRetries = options.maxRetries ?? 3;
  const ackTimeoutMs = options.ackTimeoutMs ?? 30000;
  let previousBefore: string | undefined;
  let previousAfter: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const report = await runPipeline(cwd, STAGES, { out: noopStream() });
    if (report.result === "GREEN") {
      emitLine(options.out, { ok: true, healedAtAttempt: attempt });
      return;
    }
    if (report.packetFile === null) {
      throw new Error("Pipeline failed without FIX_PACKET");
    }
    const packet = await readLastPacket(resolve(cwd, report.packetFile));
    packet.attempt = { current: attempt, max: maxRetries };
    if (attempt > 1) {
      packet.lastAttemptDiff = previousAfter !== undefined ? `${previousBefore} -> ${previousAfter}` : "no-change";
    }
    emitLine(options.out, { ok: false, packet });
    if (attempt === maxRetries) {
      const reportPath = resolve(cwd, "pipeline", "reports", `escalation_${report.runId}.json`);
      await writeEscalationReport(reportPath, report.runId, packet, maxRetries);
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-I001", `Healing failed after ${maxRetries} attempts`, ["I-11"])),
        ExitCode.INTERNAL_ERROR
      );
    }
    const targetPath = resolve(cwd, packet.target.file);
    try {
      await stat(targetPath);
    } catch {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-I001", `Target file ${packet.target.file} does not exist`, ["I-11"])),
        ExitCode.INTERNAL_ERROR
      );
    }
    const hashBefore = await hashFile(targetPath);
    await waitForAck(cwd, packet.packetId, 500, ackTimeoutMs);
    const hashAfter = await hashFile(targetPath);
    if (hashBefore === hashAfter) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-I001", `Target file ${packet.target.file} did not change after ack`, ["I-11"])),
        ExitCode.INTERNAL_ERROR
      );
    }
    previousBefore = hashBefore;
    previousAfter = hashAfter;
  }
}
