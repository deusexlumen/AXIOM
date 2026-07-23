import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { pathToFileURL } from "node:url";
import { getCommandHandler } from "@/cli/commands/registry.js";
import { CliError } from "@/cli/errors.js";
import { captureStdout } from "@/cli/mcp/capture.js";
import { tools } from "@/cli/mcp/tools.js";

export function createServer(): Server {
  const server = new Server(
    { name: "atelier-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find((t) => t.name === request.params.name);
    if (tool === undefined) {
      return errorResult(`Unknown tool: ${request.params.name}`);
    }
    const args = tool.buildArgs((request.params.arguments ?? {}) as Record<string, unknown>);
    const handler = getCommandHandler(tool.command);
    if (handler === undefined) {
      return errorResult(`Unknown command: ${tool.command}`);
    }
    try {
      const { exitCode, lines } = await captureStdout(() => handler(args));
      if (exitCode !== 0) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify([...lines, { type: "result", ok: false, data: { exitCode } }]),
            },
          ],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify(lines) }] };
    } catch (error) {
      if (error instanceof CliError) {
        let data: unknown;
        try {
          data = JSON.parse(error.message);
        } catch {
          data = { message: error.message, exitCode: error.exitCode };
        }
        return { content: [{ type: "text", text: JSON.stringify([{ type: "result", ok: false, data }]) }] };
      }
      const message = error instanceof Error ? error.message : String(error);
      return { content: [{ type: "text", text: JSON.stringify([{ type: "result", ok: false, data: { message } }]) }] };
    }
  });

  return server;
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify([{ type: "result", ok: false, data: { message } }]) }] };
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (pathToFileURL(process.argv[1] ?? "").href === import.meta.url) {
  await startServer();
}
