import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { addModel } from "@/cli/commands/assets.js";
import { CliError } from "@/cli/errors.js";
import { readAgentContext } from "@/cli/manifest/reader.js";

const baseDir = mkdtempSync(join(tmpdir(), "axiom-assets-model-"));

beforeAll(async () => {
  await init("assets-model", { cwd: baseDir, skipInstall: true });
}, 300000);

afterAll(() => rmSync(baseDir, { recursive: true, force: true, maxRetries: 3 }));

describe("addModel", () => {
  it("emits AXM-G003 when texture memory exceeds the default budget", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "assets-model");
    const modelPath = join(cwd, "huge.gltf");
    const hugeBytes = 70 * 1024 * 1024;
    const gltf = {
      asset: { version: "2.0" },
      images: [{ bufferView: 0 }],
      bufferViews: [{ byteLength: hugeBytes, byteOffset: 0 }],
      buffers: [{ byteLength: hugeBytes }],
    };
    writeFileSync(modelPath, JSON.stringify(gltf));

    await expect(addModel("huge.gltf", { cwd })).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof CliError)) return false;
      return error.exitCode === 10 && error.message.includes("AXM-G003");
    });
  });

  it("copies a model that stays within budget", { timeout: 120000 }, async () => {
    const cwd = join(baseDir, "assets-model");
    const modelPath = join(cwd, "tiny.gltf");
    const gltf = {
      asset: { version: "2.0" },
      images: [{ bufferView: 0 }],
      bufferViews: [{ byteLength: 1024, byteOffset: 0 }],
      buffers: [{ byteLength: 1024 }],
    };
    writeFileSync(modelPath, JSON.stringify(gltf));

    await addModel("tiny.gltf", { cwd });

    expect(existsSync(join(cwd, "public/models/tiny.gltf"))).toBe(true);
    const ctx = await readAgentContext(cwd);
    const asset = ctx.assets?.find((a) => a.name === "tiny");
    expect(asset).toBeDefined();
    expect(asset?.type).toBe("model");
  });
});
