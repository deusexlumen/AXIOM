import type { FixPacket } from "@/cli/schemas/fix-packet.js";

export interface HeadlessOptions {
  cwd?: string;
  maxRetries?: number;
  out?: NodeJS.WritableStream;
  fetchImpl?: typeof fetch;
}

export interface PacketRef {
  file: string;
  packet: FixPacket;
}

export interface ModelPatch {
  file: string;
  content: string;
}
