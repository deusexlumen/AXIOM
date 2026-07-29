import { z } from "zod/v3";

export const ContactSubmission = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  source: z.string().optional(),
});

export type ContactSubmission = z.infer<typeof ContactSubmission>;
