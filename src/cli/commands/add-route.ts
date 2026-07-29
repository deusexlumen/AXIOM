import { resolve } from "node:path";
import { readContext, writeContext } from "@/cli/manifest/mutate.js";
import { routeTsx, routeManifestTs } from "@/cli/generators/route.js";
import { hashString } from "@/cli/manifest/hash.js";
import { writeTextFile } from "@/cli/utils/fs.js";
import { result } from "@/cli/utils/ndjson.js";
import { componentExists, routeExists, duplicateError } from "@/cli/commands/add-helpers.js";
import { requireActiveLease } from "@/cli/leases/scope.js";
import { safePath } from "@/cli/commands/plan-helpers.js";
import { RouteEntry } from "@/cli/schemas/agent-context.js";
import { z } from "zod/v3";

export interface AddRouteOptions {
  component: string;
  cwd?: string;
  out?: NodeJS.WritableStream;
  agentId?: string;
}

export async function addRoute(path: string, options: AddRouteOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const ctx = await readContext(cwd);
  if (!componentExists(ctx, options.component)) {
    duplicateError(`Component ${options.component} does not exist`);
  }
  if (routeExists(ctx, path)) {
    duplicateError(`Route ${path} already exists`);
  }
  const safe = safePath(path);
  const file = `src/routes/${safe}.route.tsx`;
  const manifestPath = "src/generated/route-manifest.tsx";
  if (options.agentId) await requireActiveLease(cwd, options.agentId, [file]);
  await writeTextFile(resolve(cwd, file), routeTsx(path, options.component));
  const routeEntry: z.infer<typeof RouteEntry> = { path, component: options.component, file };
  ctx.routes.push(routeEntry);
  const manifest = routeManifestTs(ctx.routes);
  await writeTextFile(resolve(cwd, manifestPath), manifest);
  ctx.integrity.machineFiles[manifestPath] = hashString(manifest);
  await writeContext(cwd, ctx);
  result({ ok: true, files: { route: file, manifest: manifestPath } }, options.out);
}
