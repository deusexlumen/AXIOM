import { describe, it, expect } from "vitest";
import { healHandler } from "./heal-handler.js";
import { ExitCode } from "@/cli/types.js";

describe("healHandler", () => {
  it("rejects a non-numeric --max-retries", async () => {
    await expect(healHandler(["--headless", "--max-retries", "abc"])).rejects.toMatchObject({
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  });

  it("rejects a non-integer --max-retries", async () => {
    await expect(healHandler(["--headless", "--max-retries", "2.5"])).rejects.toMatchObject({
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  });

  it("rejects a non-positive --max-retries", async () => {
    await expect(healHandler(["--headless", "--max-retries", "0"])).rejects.toMatchObject({
      exitCode: ExitCode.VALIDATION_ERROR,
    });
  });
});
