export function contactHandlerTemplate(): string {
  return `import { ContactSubmission } from "@/schemas/contact";
import type { HandlerFor } from "@/api/generated/handler-types";

export function createHandler(
  input: HandlerFor<"contact.create">["input"]
): Promise<HandlerFor<"contact.create">["output"]> {
  const { name, email, message } = ContactSubmission.parse(input);
  return Promise.resolve({ ok: true, received: { name, email, message } });
}
`;
}
