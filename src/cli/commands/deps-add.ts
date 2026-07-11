import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readLedger } from "@/cli/ledger/store.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { ndjson, result } from "@/cli/utils/ndjson.js";
import { isExactVersion } from "@/cli/security/pinning.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";

export interface DepsAddOptions {
  cwd?: string;
  out?: NodeJS.WritableStream;
  noPnpm?: boolean;
}

export async function depsAdd(args: string[], options: DepsAddOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const input = args[0];
  if (!input) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required argument: <pkg@version>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  const parsed = parsePackageInput(input);
  if (!parsed) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Invalid package specifier: ${input}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  if (!isExactVersion(parsed.version)) {
    throw new CliError(
      JSON.stringify(
        cliFixPacket("AXM-V000", `Version must be pinned exactly: ${parsed.version}`, ["I-11"])
      ),
      ExitCode.VALIDATION_ERROR
    );
  }
  const noPnpm = options.noPnpm ?? process.env.AXIOM_DEPS_NO_PNPM === "1";
  await assertNotForbidden(cwd, parsed.name);
  const lockfileUpdated = await installDependency(cwd, parsed.name, parsed.version, noPnpm, options.out);
  if (lockfileUpdated) await recordLockfileHash(cwd);
  result({ ok: true, added: `${parsed.name}@${parsed.version}` }, options.out);
}

function parsePackageInput(input: string): { name: string; version: string } | null {
  const match = /^(?<name>@[^@/]+\/[^@]+|[^@]+)@(?<version>.+)$/.exec(input);
  if (!match?.groups?.name || !match.groups.version) return null;
  return { name: match.groups.name, version: match.groups.version };
}

async function assertNotForbidden(cwd: string, name: string): Promise<void> {
  const entries = await readLedger(cwd);
  const hit = entries.find(
    (e) =>
      e.class === "enforced" &&
      e.rule?.type === "forbidden-dependency" &&
      e.rule.match.includes(name)
  );
  if (hit) {
    throw new CliError(
      JSON.stringify(
        cliFixPacket("AXM-Q001", `Dependency ${name} is forbidden by ledger ${hit.id}`, ["I-11"])
      ),
      ExitCode.LEDGER_ERROR
    );
  }
}

async function installDependency(
  cwd: string,
  name: string,
  version: string,
  noPnpm: boolean,
  out?: NodeJS.WritableStream
): Promise<boolean> {
  if (!noPnpm) {
    try {
      execFileSync("pnpm", ["add", "--save-exact", `${name}@${version}`], { cwd, stdio: "ignore" });
      return true;
    } catch (error) {
      if (isEnoent(error)) {
        emitFallbackWarning(out, "pnpm not found; falling back to package.json edit");
        return editPackageJsonFallback(cwd, name, version, out);
      }
      throw error;
    }
  }
  return editPackageJsonFallback(cwd, name, version, out);
}

function isEnoent(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "ENOENT";
}

async function editPackageJsonFallback(
  cwd: string,
  name: string,
  version: string,
  out?: NodeJS.WritableStream
): Promise<boolean> {
  const path = resolve(cwd, "package.json");
  const pkg = JSON.parse(await readFile(path, "utf-8")) as Record<string, unknown>;
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  deps[name] = version;
  pkg.dependencies = deps;
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  return regenerateLockfile(cwd, out);
}

async function regenerateLockfile(cwd: string, out?: NodeJS.WritableStream): Promise<boolean> {
  try {
    execFileSync("pnpm", ["install", "--lockfile-only", "--prefer-offline", "--ignore-scripts"], {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch (error) {
    if (isEnoent(error)) {
      emitFallbackWarning(out, "pnpm not found; skipping lockfile hash update");
      return false;
    }
    throw error;
  }
}

function emitFallbackWarning(out: NodeJS.WritableStream | undefined, message: string): void {
  if (out) ndjson({ type: "log", message }, out);
}

async function recordLockfileHash(cwd: string): Promise<void> {
  const context = await readContext(cwd);
  const hash = await hashFile(resolve(cwd, "pnpm-lock.yaml"));
  context.integrity.machineFiles["pnpm-lock.yaml"] = hash;
  await writeContext(cwd, context);
}
