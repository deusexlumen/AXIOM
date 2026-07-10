import { z } from "zod/v3";

export const TokenValue = z.union([z.string(), z.record(z.string())]);

export type TokenValue = z.infer<typeof TokenValue>;

export const TokensJson = z.record(z.record(TokenValue));

export type TokensJson = z.infer<typeof TokensJson>;
