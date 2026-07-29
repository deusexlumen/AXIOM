import type { HeuristicFinding } from "@/cli/schemas/critic-report.js";
import type { ProjectFiles } from "@/cli/critic/collect-files.js";

const DEFAULT_EASINGS: number[][] = [
  [0, 0, 1, 1],
  [0.25, 0.1, 0.25, 1],
  [0.33, 0, 0.67, 1],
  [0.4, 0, 0.2, 1],
  [0.22, 1, 0.36, 1],
  [0.83, 0, 0.17, 1],
];

function curveKey(curve: number[]): string {
  return curve.map((n) => n.toFixed(2)).join(",");
}

const DEFAULT_KEYS = new Set(DEFAULT_EASINGS.map(curveKey));

export function checkCustomEasings(files: ProjectFiles): HeuristicFinding[] {
  if (files.motion.trim() === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(files.motion);
  } catch {
    return [];
  }
  if (parsed === null || typeof parsed !== "object") return [];
  const rawEase = (parsed as Record<string, unknown>).ease;
  if (rawEase === null || typeof rawEase !== "object") return [];
  const ease = rawEase as Record<string, unknown>;
  if (Object.keys(ease).length === 0) return [];
  const curves = Object.values(ease)
    .map((entry) => (entry !== null && typeof entry === "object" ? (entry as Record<string, unknown>).curve : undefined))
    .filter((c): c is number[] => Array.isArray(c) && c.length === 4 && c.every((n) => typeof n === "number"));
  if (curves.length > 0 && curves.every((c) => DEFAULT_KEYS.has(curveKey(c)))) {
    return [
      {
        checkId: "AXM-R007",
        rubric: "motionCohesion",
        severity: "warning",
        message: "MOTION.axm.json only contains default GSAP easings; no custom cubic-bezier defined.",
        evidence: { file: "MOTION.axm.json", excerpt: "ease: " + Object.keys(ease).join(", ") },
      },
    ];
  }
  return [];
}
