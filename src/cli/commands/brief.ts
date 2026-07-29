import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { BriefJson } from "@/cli/schemas/brief.js";
import { buildBrief, listMissingFields, type AnswerSet } from "@/cli/elicitation/interview.js";
import { result } from "@/cli/utils/ndjson.js";
import { CliError } from "@/cli/errors.js";
import { buildFixPacket } from "@/cli/validate/packet.js";
import { ExitCode } from "@/cli/types.js";

export async function briefElicit({
  cwd,
  answersPath,
  out,
}: {
  cwd: string;
  answersPath?: string;
  out?: NodeJS.WritableStream;
}): Promise<void> {
  let answers: AnswerSet = {};
  if (answersPath) {
    const raw = await readFile(resolve(cwd, answersPath), "utf-8");
    answers = JSON.parse(raw) as AnswerSet;
  }

  const missing = listMissingFields(answers);
  if (missing.length > 0) {
    throw new CliError(
      JSON.stringify(
        buildFixPacket(
          "AXM-P001",
          `Brief is incomplete. Missing fields: ${missing.join(", ")}`,
          "BRIEF.axm.json",
          ["I-11"],
          "Provide answers for all required fields via --answers <path>.",
          "Required BRIEF fields are missing."
        )
      ),
      ExitCode.VALIDATION_ERROR
    );
  }

  const brief = buildBrief(answers);
  const briefPath = resolve(cwd, "BRIEF.axm.json");
  await writeFile(briefPath, `${JSON.stringify(brief, null, 2)}\n`, "utf-8");
  result({ ok: true, file: "BRIEF.axm.json" }, out);
}

export async function loadBrief(cwd: string): Promise<BriefJson> {
  const briefPath = resolve(cwd, "BRIEF.axm.json");
  let raw: string;
  try {
    raw = await readFile(briefPath, "utf-8");
  } catch {
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-P001", "Brief file not found: BRIEF.axm.json", "BRIEF.axm.json", ["I-11"], "Run atl brief elicit first.", "Missing BRIEF.axm.json")),
      ExitCode.VALIDATION_ERROR
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-P001", "Brief file is not valid JSON", "BRIEF.axm.json", ["I-11"], "Validate or regenerate BRIEF.axm.json.", "Invalid BRIEF JSON")),
      ExitCode.VALIDATION_ERROR
    );
  }
  const validated = BriefJson.safeParse(parsed);
  if (!validated.success) {
    throw new CliError(
      JSON.stringify(buildFixPacket("AXM-P001", `Brief schema invalid: ${validated.error.message}`, "BRIEF.axm.json", ["I-11"], "Fix the fields listed in the error.", "Brief schema invalid")),
      ExitCode.VALIDATION_ERROR
    );
  }
  return validated.data;
}

export async function briefValidate({
  cwd,
  out,
}: {
  cwd: string;
  out?: NodeJS.WritableStream;
}): Promise<void> {
  await loadBrief(cwd);
  result({ ok: true, valid: true }, out);
}
