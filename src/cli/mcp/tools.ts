interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, { type: "string"; description: string }>;
    required?: string[];
  };
  command: string;
  buildArgs: (params: Record<string, unknown>) => string[];
}

function s(params: Record<string, unknown>, key: string): string {
  return String(params[key] ?? "");
}

function o(params: Record<string, unknown>, key: string): string | undefined {
  const value = params[key];
  return value === undefined ? undefined : String(value);
}

function flag(value: string | undefined, name: string): string[] {
  return value === undefined ? [] : [name, value];
}

function tool(
  name: string,
  command: string,
  description: string,
  buildArgs: (params: Record<string, unknown>) => string[],
  props: Record<string, string> = {},
  required: string[] = [],
): ToolDefinition {
  const properties: Record<string, { type: "string"; description: string }> = {};
  for (const [key, value] of Object.entries(props)) {
    properties[key] = { type: "string", description: value };
  }
  return { name, command, description, buildArgs, inputSchema: { type: "object", properties, required } };
}

export const tools: ToolDefinition[] = [
  tool("atelier_brief_elicit", "brief", "Run brief elicitation.", (p) => ["elicit", ...flag(o(p, "answers"), "--answers")], { answers: "JSON answer set path." }),
  tool("atelier_brief_validate", "brief", "Validate BRIEF.axm.json.", () => ["validate"]),
  tool("atelier_direct_generate", "direct", "Generate direction candidates.", () => ["generate"]),
  tool("atelier_direct_choose", "direct", "Freeze a direction.", (p) => ["choose", s(p, "id")], { id: "Direction id." }, ["id"]),
  tool("atelier_direct_amend", "direct", "Request direction amendment.", (p) => ["amend", "--reason", s(p, "reason")], { reason: "Amendment reason." }, ["reason"]),
  tool("atelier_tokens_build", "tokens", "Build theme.css from tokens.", () => ["build"]),
  tool("atelier_motion_build", "motion", "Build motion.ts from MOTION.axm.json.", () => ["build"]),
  tool("atelier_pattern_add", "pattern", "Instantiate a pattern.", (p) => ["add", s(p, "name"), "--params", s(p, "params")], { name: "Pattern name.", params: "JSON params." }, ["name", "params"]),
  tool("atelier_pattern_list", "pattern", "List patterns.", (p) => ["list", ...flag(o(p, "category"), "--category")], { category: "Category filter." }),
  tool("atelier_pattern_eject", "pattern", "Eject a pattern for bespoke edits.", (p) => ["eject", s(p, "name")], { name: "Pattern name." }, ["name"]),
  tool("atelier_critic_run", "critic", "Run CRITIC review.", (p) => ["run", ...flag(o(p, "route"), "--route")], { route: "Route scope." }),
  tool("atelier_validate", "validate", "Run invariant validation.", () => [], {}),
  tool("atelier_pipeline_run", "pipeline", "Run pipeline.", (p) => ["run", ...flag(o(p, "scope"), "--scope"), ...flag(o(p, "stage"), "--stage")], { scope: "Scope filter.", stage: "Stage filter." }),
  tool("atelier_context_slice", "context", "Get context slice for a file.", (p) => ["slice", "--for", s(p, "file")], { file: "Target file." }, ["file"]),
  tool("atelier_deploy", "deploy", "Deploy project.", (p) => [...flag(o(p, "env"), "--env")], { env: "preview or prod." }),
];
