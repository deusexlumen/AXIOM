import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Writable } from "node:stream";
import { ContactSubmission } from "@/cli/schemas/form.js";
import { init } from "@/cli/commands/init.js";
import { installPackage } from "@/cli/commands/integration-deps.js";

function noopStream(): NodeJS.WritableStream {
  return new Writable({ write() {} });
}

describe("ContactSubmission schema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "This is a long enough message to pass validation.",
  };

  it("accepts valid input", () => {
    expect(ContactSubmission.safeParse(valid).success).toBe(true);
  });

  it("rejects a short message", () => {
    const result = ContactSubmission.safeParse({ ...valid, message: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a bad email", () => {
    const result = ContactSubmission.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = ContactSubmission.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty email", () => {
    const result = ContactSubmission.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only message", () => {
    const result = ContactSubmission.safeParse({ ...valid, message: "     " });
    expect(result.success).toBe(false);
  });

  it("accepts source when provided", () => {
    const result = ContactSubmission.safeParse({ ...valid, source: "web" });
    expect(result.success).toBe(true);
  });
});

describe("init scaffold", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-form-init-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("creates contact form files by default", { timeout: 30000 }, async () => {
    const appDir = join(baseDir, "contact-demo");
    mkdirSync(appDir, { recursive: true });
    installPackage(appDir, "zod");

    await init("contact-demo", { cwd: baseDir, skipInstall: true, out: noopStream() });

    expect(existsSync(join(appDir, "app/contact/page.tsx"))).toBe(true);
    expect(existsSync(join(appDir, "src/components/ContactForm.tsx"))).toBe(true);
    expect(existsSync(join(appDir, "src/schemas/contact.ts"))).toBe(true);
    expect(existsSync(join(appDir, "api/contracts/contact.contract.ts"))).toBe(true);
    expect(existsSync(join(appDir, "api/handlers/contact.create.ts"))).toBe(true);
    expect(existsSync(join(appDir, "api/generated/handler-types.ts"))).toBe(true);
    expect(existsSync(join(appDir, "src/generated/api-client.ts"))).toBe(true);
    expect(existsSync(join(appDir, "api/generated/openapi.json"))).toBe(true);

    expect(existsSync(join(appDir, "app/api/contact/route.ts"))).toBe(false);

    const handler = readFileSync(join(appDir, "api/handlers/contact.create.ts"), "utf-8");
    expect(handler).toContain('HandlerFor<"contact.create">');
    expect(handler).toContain("ContactSubmission");

    const client = readFileSync(join(appDir, "src/generated/api-client.ts"), "utf-8");
    expect(client).toContain("contactCreate");

    const component = readFileSync(join(appDir, "src/components/ContactForm.tsx"), "utf-8");
    expect(component).toContain("contactCreate");
    expect(component).not.toContain('fetch("/api/contact"');

    const page = readFileSync(join(appDir, "app/contact/page.tsx"), "utf-8");
    expect(page).toContain("ContactForm");
  });
});
