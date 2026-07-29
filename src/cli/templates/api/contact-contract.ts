import { z } from "zod/v3";
import type { ContractDefinition } from "@/cli/schemas/contract.js";

export const contactContractDefinition: ContractDefinition = {
  name: "contact",
  routes: {
    create: {
      method: "POST",
      path: "/api/contact",
      input: z.custom<z.ZodTypeAny>(() => true),
      output: z.custom<z.ZodTypeAny>(() => true),
      errors: { "400": "Invalid submission" },
    },
  },
};

export function contactContractTemplate(): string {
  return `import { z } from "zod";
import { ContactSubmission } from "@/schemas/contact";

const ContactResponse = z.object({
  ok: z.literal(true),
  received: z.object({
    name: z.string(),
    email: z.string(),
    message: z.string(),
  }),
});

export const contactContract = {
  name: "contact",
  routes: {
    create: {
      method: "POST",
      path: "/api/contact",
      input: ContactSubmission,
      output: ContactResponse,
      errors: { "400": "Invalid submission" },
    },
  },
};
`;
}
