import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export interface HeadlessOptions {
  cwd?: string;
  maxRetries?: number;
  out?: NodeJS.WritableStream;
  fetchImpl?: typeof fetch;
  githubFetchImpl?: typeof fetch;
  runPipeline?: RunPipeline;
}

export interface PipelineReport {
  result: "GREEN" | "RED";
  packetFile: string | null;
}

export type RunPipeline = (cwd: string) => Promise<PipelineReport>;

export interface PacketRef {
  file: string;
  packet: FixPacket;
}

export interface ModelPatch {
  file: string;
  content: string;
}
