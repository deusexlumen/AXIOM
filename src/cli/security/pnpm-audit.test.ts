import { describe, it, expect, vi } from "vitest";
import { EventEmitter } from "node:events";
import { checkAuditFindings } from "@/cli/security/pnpm-audit.js";

vi.mock("node:child_process", () => ({
  spawn: vi.fn((_command, _args, _options) => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    }) as unknown as import("node:child_process").ChildProcess;
    process.nextTick(() => {
      child.emit("error", { code: "ENOENT", message: "spawn pnpm ENOENT" });
    });
    return child;
  }),
}));

describe("checkAuditFindings", () => {
  it("returns AXM-S002 when pnpm is not installed", async () => {
    const packet = await checkAuditFindings({
      cwd: "/tmp",
      packageJson: {},
      lockfileHash: "",
      manifestHash: null,
    });
    expect(packet).not.toBeNull();
    expect(packet?.errorCode).toBe("AXM-S002");
    expect(packet?.message).toContain("pnpm audit could not be completed");
  });
});
