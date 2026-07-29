import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError, cliFixPacket } from "@/cli/errors.js";
import { ExitCode } from "@/cli/types.js";
import { takeValue, requireArg } from "@/cli/bin-helpers.js";
import { contractHash } from "@/cli/api/contract.js";
import {
  loadContract,
  contractFile,
  handlerFile,
  handlerTypesFile,
  clientFile,
  openapiFile,
  uniqueContractNames,
} from "@/cli/commands/api-helpers.js";
import {
  copyContract,
  generateHandlers,
  regenerateArtifacts,
  addEndpoints,
  generatedFiles,
} from "@/cli/commands/api-generate.js";
import { requireActiveLease } from "@/cli/leases/scope.js";

export async function apiCommand(args: string[]): Promise<void> {
  const sub = args[0];
  if (sub === "add") return apiAdd(args.slice(1));
  if (sub === "build") return apiBuild();
  throw new CliError(
    JSON.stringify(cliFixPacket("AXM-V000", `Unknown api subcommand: ${sub ?? ""}`, ["I-11"])),
    ExitCode.VALIDATION_ERROR
  );
}

async function apiAdd(args: string[]): Promise<void> {
  const name = requireArg(args[0], "<name>");
  const { value: contractPath, rest } = takeValue(args.slice(1), "--contract");
  const { value: agentId } = takeValue(rest, "--agent");
  if (!contractPath) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", "Missing required flag: --contract <path>", ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
  validateName(name);
  const cwd = process.cwd();
  const context = await readContext(cwd);
  const sourceContract = await loadContract(resolve(cwd, contractPath), cwd);
  const agentFiles = [contractFile(name), ...Object.keys(sourceContract.routes).map((k) => handlerFile(name, k))];
  if (agentId) await requireActiveLease(cwd, agentId, agentFiles);
  if (sourceContract.name !== name) {
    throw new CliError(
      JSON.stringify(
        cliFixPacket("AXM-C003", `Contract name mismatch: expected ${name}, got ${sourceContract.name}`, ["I-11"])
      ),
      ExitCode.VALIDATION_ERROR
    );
  }
  await copyContract(contractPath, resolve(cwd, contractFile(name)));
  await generateHandlers(name, sourceContract, cwd);
  await regenerateArtifacts(cwd, context, name);
  addEndpoints(context, name, sourceContract);
  await writeContext(cwd, context);
  result({ ok: true, files: generatedFiles(name, sourceContract) });
}

async function apiBuild(): Promise<void> {
  const cwd = process.cwd();
  const context = await readContext(cwd);
  const names = uniqueContractNames(context.endpoints ?? []);
  for (const name of names) {
    const contract = await loadContract(resolve(cwd, contractFile(name)), cwd);
    const expected = context.integrity.machineFiles[contractFile(name)];
    if (expected && expected !== contractHash(contract)) {
      throw new CliError(
        JSON.stringify(cliFixPacket("AXM-C004", `Contract drift detected for ${name}`, ["I-10"])),
        ExitCode.VALIDATION_ERROR
      );
    }
  }
  await regenerateArtifacts(cwd, context);
  await writeContext(cwd, context);
  result({ ok: true, files: [handlerTypesFile(), clientFile(), openapiFile()] });
}

function validateName(name: string): void {
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
    throw new CliError(
      JSON.stringify(cliFixPacket("AXM-V000", `Name must be PascalCase or camelCase: ${name}`, ["I-11"])),
      ExitCode.VALIDATION_ERROR
    );
  }
}
