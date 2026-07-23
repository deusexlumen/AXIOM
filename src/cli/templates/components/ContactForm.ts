export function contactFormComponent(): string {
  return `"use client";

import { useState, type SyntheticEvent } from "react";
import { contactCreate } from "@/generated/api-client";
import { useChoreo } from "@/core/useChoreo";
import { Stage } from "@/core/Stage";

export function ContactForm() {
  const { isReducedMotion } = useChoreo({ id: "ContactForm", reducedMotion: "instant" });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  function getFieldValue(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    const data = new FormData(form);
    const body = {
      name: getFieldValue(data, "name"),
      email: getFieldValue(data, "email"),
      message: getFieldValue(data, "message"),
    };
    try {
      await contactCreate(body);
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      data-axm-id="ContactForm"
      className={\`relative bg-primary text-primary-fg \${isReducedMotion ? "opacity-100" : "opacity-95"}\`}
    >
      <Stage className="absolute inset-0" />
      <form
        onSubmit={(event) => { void handleSubmit(event); }}
        className="relative z-10 mx-auto max-w-md space-y-4 p-8"
      >
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={1}
            className="w-full rounded border-b bg-surface-raised p-2 text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            className="w-full rounded border-b bg-surface-raised p-2 text-text-primary"
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-sm font-medium">
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            rows={4}
            className="w-full rounded border-b bg-surface-raised p-2 text-text-primary"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded bg-action-primary px-4 py-2 font-medium text-text-primary"
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
        {status === "ok" && <p role="status" className="text-sm">Message sent.</p>}
        {status === "error" && <p role="status" className="text-sm text-action-danger">Something went wrong. Please try again.</p>}
      </form>
    </section>
  );
}
`;
}
