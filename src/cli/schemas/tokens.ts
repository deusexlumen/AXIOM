import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface TokenValueRecord {
  [key: string]: TokenValue;
}

export type TokenValue = string | TokenValueRecord;
export const TokenValue: z.ZodType<TokenValue> = z.union([
  z.string(),
  z.record(z.string(), z.lazy(() => TokenValue)),
]);
export const Tokens = z.record(z.string(), TokenValue);

export type Tokens = z.infer<typeof Tokens>;

export const TokensJsonSchema = zodToJsonSchema(Tokens, { name: "tokens" });
