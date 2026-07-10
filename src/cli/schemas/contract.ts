import { z } from "zod/v3";

export const HttpMethod = z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]);

export const ContractRoute = z.object({
  method: HttpMethod,
  path: z.string(),
  input: z.custom<z.ZodTypeAny>(),
  output: z.custom<z.ZodTypeAny>(),
  errors: z.record(z.string(), z.string()),
});

export type ContractRoute = z.infer<typeof ContractRoute>;

export const ContractDefinition = z.object({
  name: z.string(),
  routes: z.record(z.string(), ContractRoute),
});

export type ContractDefinition = z.infer<typeof ContractDefinition>;

export type ContractRouteName<C extends ContractDefinition> = {
  [K in keyof C["routes"]]: `${C["name"]}.${K & string}`;
}[keyof C["routes"]];
