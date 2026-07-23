import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";
import type { ProjectFiles } from "@/cli/critic/collect-files.js";

const SYSTEM_FONTS = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Roboto",
  "Helvetica",
  "Arial",
  "sans-serif",
  "serif",
  "monospace",
];

const SYSTEM_FONT_SET = new Set(SYSTEM_FONTS.map((f) => f.toLowerCase()));

function extractFontNames(value: string): string[] {
  const afterColon = value.slice(value.indexOf(":") + 1);
  return afterColon
    .replace(/["']/g, "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function hasOnlySystemFonts(value: string): boolean {
  const fonts = extractFontNames(value);
  return fonts.length > 0 && fonts.every((f) => SYSTEM_FONT_SET.has(f.toLowerCase()));
}

function pushFinding(findings: HeuristicFinding[], file: string, excerpt: string): void {
  findings.push({
    checkId: "AXM-R003",
    rubric: "typographicCraft",
    severity: "warning",
    message: "Systemfont stack detected without a loaded custom/variable font.",
    evidence: { file, excerpt: excerpt.slice(0, 120) },
  });
}

function scanCssFontFamilies(content: string): string[] {
  return (content.match(/font-family\s*:\s*[^;}\n]+/gi) ?? []).filter(hasOnlySystemFonts);
}

function scanTokensFontFamilies(tokens: string): string[] {
  return (tokens.match(/"(?:fontFamily|font-family|family)"\s*:\s*"([^"]+)"/gi) ?? []).filter(hasOnlySystemFonts);
}

function scanTsxSystemfont(content: string): string[] {
  const hits: string[] = [];
  for (const match of content.matchAll(/\bfont-(sans|serif|mono)\b/gi)) {
    hits.push(`Tailwind class ${match[0]}`);
  }
  for (const match of content.matchAll(/style\s*=\s*\{\s*\{[^}]*fontFamily\s*:\s*["']([^"']+)["']/gi)) {
    const value = match[1] ?? "";
    if (hasOnlySystemFonts(value)) hits.push(`inline fontFamily: ${value}`);
  }
  return hits;
}

export function checkSystemfont(files: ProjectFiles): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  for (const [file, content] of Object.entries(files.cssSources)) {
    for (const match of scanCssFontFamilies(content)) {
      pushFinding(findings, file, match);
    }
  }
  for (const match of scanTokensFontFamilies(files.tokens)) {
    pushFinding(findings, "tokens.json", match);
  }
  for (const [file, content] of Object.entries(files.tsxSources)) {
    for (const match of scanTsxSystemfont(content)) {
      pushFinding(findings, file, match);
    }
  }
  return findings;
}
