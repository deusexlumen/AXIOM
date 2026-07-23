export function contactSchemaTs(): string {
  return `import { z } from "zod";

export const ContactSubmission = z.object({
  name: z.string().min(1),
  email: z.email(),
  message: z.string().min(10),
  source: z.string().optional(),
});

export type ContactSubmission = z.infer<typeof ContactSubmission>;
`;
}
