import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { init } from "@/cli/commands/init.js";
import { installAppDeps } from "@/cli/commands/integration-deps.js";
import { noopStream, runValidate, parsePacket, writeMinimalContext, installComponent } from "@/cli/commands/validate.integration.helpers.js";

let baseDir: string;
let appDir: string;

beforeAll(async () => {
  baseDir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
  await init("demo", { cwd: baseDir, skipInstall: true, out: noopStream() });
  appDir = join(baseDir, "demo");
  installAppDeps(appDir);
}, 300000);

afterAll(() => rmSync(baseDir, { recursive: true, force: true }));

describe("axm validate invariant fixtures", () => {
  it("reports AXM-V002 for a file exceeding byte budget", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    writeMinimalContext(dir, { lockedFiles: {}, machineFiles: {} });
    const big = "x".repeat(5000);
    installComponent(dir, "Big", "src/components/Big.tsx", `export function Big() { return <div data-axm-id="Big">${big}</div>; }\n`);
    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(10);
    expect(parsePacket(stdout).errorCode).toBe("AXM-V002");
    rmSync(dir, { recursive: true, force: true });
  }, 60000);

  it("reports AXM-V010 for a component placed in a LOCKED zone", async () => {
    const dir = mkdtempSync(join(tmpdir(), "axiom-validate-"));
    writeMinimalContext(dir, { lockedFiles: { "src/core/router.ts": "sha256:aaa" }, machineFiles: {} });
    mkdirSync(join(dir, "src", "core"), { recursive: true });
    installComponent(dir, "Bad", "src/core/router.ts", "export function Bad() { return null; }\n");
    const { exitCode, stdout } = await runValidate(dir);
    expect(exitCode).toBe(60);
    expect(parsePacket(stdout).errorCode).toBe("AXM-V010");
    rmSync(dir, { recursive: true, force: true });
  }, 60000);

  const cases = [
    { code: "AXM-V001", inv: "I-01", file: "src/components/V001.tsx", content: `${Array.from({ length: 130 }, (_, i) => `const a${i} = ${i};`).join("\n")}\nexport function V001() { return <div data-axm-id="V001" />; }\n` },
    { code: "AXM-V004", inv: "I-04", file: "src/components/V004.tsx", content: "export default function V004() { return <div />; }\n" },
    { code: "AXM-V005", inv: "I-05", file: "src/components/V005.tsx", content: 'export { Helper } from "./V005Helper";\n', helpers: [["src/components/V005Helper.tsx", "export function Helper() { return <div />; }\n"]] },
    { code: "AXM-V006", inv: "I-06", file: "src/components/V006.tsx", content: 'import { Helper } from "./V006Helper";\nexport function V006() { return <Helper data-axm-id="V006" />; }\n', helpers: [["src/components/V006Helper.tsx", "export function Helper() { return <div />; }\n"]] },
    { code: "AXM-V008", inv: "I-08", file: "src/components/V008.tsx", content: 'export function V008() { return <div data-axm-id="V008" style={{ color: "#ff0000" }} />; }\n' },
    { code: "AXM-V009", inv: "I-09", file: "src/components/V009.tsx", content: "export function V009() {\n  // @ts-ignore\n  return <div data-axm-id=\"V009\" />;\n}\n" },
    { code: "AXM-V012", inv: "I-12", file: "src/components/V012.tsx", content: 'export function V012() {\n  const dynamicPath = "./V012Helper";\n  void import(dynamicPath);\n  return <div data-axm-id="V012" />;\n}\n', helpers: [["src/components/V012Helper.tsx", "export function V012Helper() { return <div />; }\n"]] },
    { code: "AXM-E002", inv: "I-13", file: "src/components/V013.tsx", content: "export function V013() { return <div />; }\n" },
  ];

  it.each(cases)("reports $code for $inv", async ({ file, content, code, helpers }) => {
    for (const [helperFile, helperContent] of helpers ?? []) {
      writeFileSync(join(appDir, helperFile!), helperContent!);
    }
    installComponent(appDir, file.slice(14, -4), file, content);
    const { exitCode, stdout } = await runValidate(appDir);
    expect(exitCode).toBe(10);
    expect(parsePacket(stdout).errorCode).toBe(code);
  }, 60000);
});
