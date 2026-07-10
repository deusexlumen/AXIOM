import type { ApiEndpoint } from "@/cli/commands/api-helpers.js";

export function clientTs(endpoints: ApiEndpoint[]): string {
  if (endpoints.length === 0) {
    return `export const apiClient = {};
`;
  }
  const contracts = [...new Set(endpoints.map((ep) => ep.contractName))];
  const imports = contracts
    .map((name) => `import type { ${name}Contract } from "@/api/contracts/${name}.contract";`)
    .join("\n");
  const methods = endpoints.map((ep) => {
    const inputType = `z.infer<typeof ${ep.contractName}Contract.routes.${ep.routeKey}.input>`;
    const outputType = `z.infer<typeof ${ep.contractName}Contract.routes.${ep.routeKey}.output>`;
    const body = ep.method === "GET" ? "" : `, headers: { "Content-Type": "application/json" }, body: JSON.stringify(input)`;
    return `export async function ${ep.clientMethod}(input: ${inputType}): Promise<${outputType}> {
  const res = await fetch(\`\${API_BASE}${ep.path}\`, { method: "${ep.method}"${body} });
  if (!res.ok) throw new Error(\`API error: \${res.status}\`);
  return res.json();
}`;
  }).join("\n\n");
  return `import { z } from "zod";
${imports}

const API_BASE = "";

${methods}
`;
}
