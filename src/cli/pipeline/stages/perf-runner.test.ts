import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startStaticServer } from "@/cli/pipeline/stages/perf-runner.js";

describe("startStaticServer", () => {
  let baseDir: string;

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true });
  });

  it("serves root index.html when present", async () => {
    baseDir = mkdtempSync(join(tmpdir(), "perf-server-root-"));
    writeFileSync(join(baseDir, "index.html"), "<html>root</html>");
    const server = await startStaticServer(baseDir);
    try {
      const res = await fetch(`${server.url}/`);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<html>root</html>");
    } finally {
      await server.close();
    }
  });

  it("serves nested index.html when root index.html is missing", async () => {
    baseDir = mkdtempSync(join(tmpdir(), "perf-server-nested-"));
    const nested = join(baseDir, "server", "pages");
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(nested, "index.html"), "<html>nested</html>");
    const server = await startStaticServer(baseDir);
    try {
      const res = await fetch(`${server.url}/`);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("<html>nested</html>");
    } finally {
      await server.close();
    }
  });
});
