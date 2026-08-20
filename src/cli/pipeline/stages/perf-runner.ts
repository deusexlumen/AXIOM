import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, resolve, sep } from "node:path";
import type { Page } from "@playwright/test";
import type { TraceEvent } from "@/cli/pipeline/stages/perf-trace.js";

export type CDPClient = { send: (method: string, params?: Record<string, unknown>) => Promise<unknown>; on: (event: string, handler: (params: Record<string, unknown>) => void) => void };
export type Step = { action: "scroll" | "click" | "wait"; y?: number; selector?: string; ms?: number };
export type Scenario = { name: string; steps: Step[] };

function findHtmlEntry(root: string): string | undefined {
  const indexPath = resolve(root, "index.html");
  if (existsSync(indexPath)) return root;
  const entries = readdirSync(root);
  for (const entry of entries) {
    const full = resolve(root, entry);
    if (statSync(full).isDirectory()) {
      const found = findHtmlEntry(full);
      if (found !== undefined) return found;
    } else if (entry.endsWith(".html")) {
      return dirname(full);
    }
  }
  return undefined;
}

export function startStaticServer(root: string): Promise<{ url: string; close: () => Promise<void> }> {
  const rootResolved = resolve(root);
  const serveRoot = findHtmlEntry(rootResolved) ?? rootResolved;
  const mimeTypes: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".txt": "text/plain",
  };
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const requested = resolve(serveRoot, pathname === "/" ? "index.html" : pathname.slice(1));
    const candidates = [requested, `${requested}.html`, resolve(requested, "index.html")];
    const file = candidates.find((candidate) => candidate.startsWith(serveRoot + sep) && existsSync(candidate) && statSync(candidate).isFile());
    if (file === undefined) { res.writeHead(404).end("Not found"); return; }
    try {
      const content = readFileSync(file);
      const ext = file.slice(file.lastIndexOf("."));
      res.writeHead(200, { "Content-Type": mimeTypes[ext] ?? "application/octet-stream" }).end(content);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => server.listen(0, "127.0.0.1", () => {
    const addr = server.address();
    const port = typeof addr === "object" && addr !== null ? addr.port : 0;
    resolve({ url: `http://127.0.0.1:${String(port)}`, close: () => new Promise<void>((ok, fail) => server.close((err) => err ? fail(err) : ok())) });
  }));
}

async function runStep(page: Page, step: Step, pageErrors: string[]): Promise<void> {
  if (step.action === "scroll") await page.evaluate(`window.scrollBy(0, ${String(step.y ?? 500)})`);
  else if (step.action === "click" && step.selector !== undefined) {
    try {
      // A generous actionability window: interactive elements may be briefly covered by
      // hydration-driven intro overlays (e.g. a preloader) that fade out once GSAP timelines
      // run. Waiting longer than the 30s default absorbs slow hydration under CI load without
      // affecting the frame-timing measurement (idle waiting produces no long tasks).
      await page.click(step.selector, { timeout: 60000 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const context = pageErrors.length > 0 ? ` | page errors: ${pageErrors.join("; ")}` : "";
      throw new Error(`${message}${context}`);
    }
  } else if (step.action === "wait") await page.waitForTimeout(step.ms ?? 100);
}

export async function runScenario(page: Page, baseUrl: string, route: string, scenario: Scenario): Promise<TraceEvent[]> {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("console", (msg) => { if (msg.type() === "error") pageErrors.push(msg.text()); });
  page.on("response", (res) => { if (res.status() >= 400) pageErrors.push(`HTTP ${String(res.status())}: ${res.url()}`); });
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  const client = await page.context().newCDPSession(page) as CDPClient;
  const events: TraceEvent[] = [];
  client.on("Tracing.dataCollected", (params) => { const v = params.value as TraceEvent[] | undefined; if (v !== undefined) events.push(...v); });
  // blink.user_timing carries the choreo:<id>:start/end marks useChoreo emits.
  // Without it the trace holds no marks at all and frame attribution always
  // reported "unknown".
  await client.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame" });
  for (const step of scenario.steps) await runStep(page, step, pageErrors);
  const tracingComplete = new Promise<void>((resolve) => client.on("Tracing.tracingComplete", () => resolve()));
  await client.send("Tracing.end");
  await tracingComplete;
  return events;
}
