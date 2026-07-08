import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeTextFile, writeJsonFile } from "@/cli/utils/fs.js";

describe("fs utils", () => {
  let baseDir: string;

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), "axiom-fs-test-"));
  });

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("writes text files with LF line endings", async () => {
    const file = join(baseDir, "test.txt");
    await writeTextFile(file, "hello\r\nworld");
    const content = readFileSync(file, "utf-8");
    expect(content).toBe("hello\nworld");
  });

  it("writes JSON with sorted top-level keys", async () => {
    const file = join(baseDir, "test.json");
    await writeJsonFile(file, { z: 1, a: 2 });
    const content = readFileSync(file, "utf-8");
    expect(content).toBe(`{\n  "a": 2,\n  "z": 1\n}\n`);
  });
});
