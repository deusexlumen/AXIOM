import { resolve } from "node:path";
import { readLedger } from "@/cli/ledger/store.js";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { hashFile } from "@/cli/manifest/hash.js";
import { result } from "@/cli/utils/ndjson.js";
import { isExactVersion } from "@/cli/security/pinning.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { installDependency } from "@/cli/commands/deps-install.js";

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

async function recordLockfileHash(cwd: string): Promise<void> {
  const context = await readContext(cwd);
  const hash = await hashFile(resolve(cwd, "pnpm-lock.yaml"));
  context.integrity.machineFiles["pnpm-lock.yaml"] = hash;
  await writeContext(cwd, context);
}
