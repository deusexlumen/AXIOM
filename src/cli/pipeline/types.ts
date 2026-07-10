import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export type StageName = "generate" | "validate" | "contract" | "typecheck" | "lint" | "unit" | "e2e";

export interface StageResult {
  ok: boolean;
  packet?: FixPacket;
}

export interface Stage {
  name: StageName;
  run(cwd: string, scope?: string[]): Promise<StageResult>;
}

export interface PipelineOptions {
  scope?: string;
  stage?: StageName;
  out?: NodeJS.WritableStream;
}

export interface PipelineReport {
  runId: string;
  result: "GREEN" | "RED";
  failedStage: StageName | null;
  packetFile: string | null;
}
