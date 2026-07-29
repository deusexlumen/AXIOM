import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { HeuristicFinding, CriticReport } from "@/cli/schemas/critic-report.js";
import { DirectionJson } from "@/cli/schemas/direction.js";

export interface CriticScores {
  rubrics: CriticReport["rubrics"];
  overall: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function computeScores(cwd: string, findings: HeuristicFinding[]): Promise<CriticScores> {
  const antiCount = findings.filter((f) => f.rubric === "antiTemplate").length;
  const motionDefault = findings.some((f) => f.checkId === "AXM-R007");
  const systemfont = findings.some((f) => f.checkId === "AXM-R003");

  let direction: DirectionJson | undefined;
  try {
    const raw = await readFile(resolve(cwd, "DIRECTION.axm.json"), "utf-8");
    direction = DirectionJson.parse(JSON.parse(raw));
  } catch {
    direction = undefined;
  }

  const rubrics: CriticReport["rubrics"] = {
    directionalFidelity: direction?.directionId ? 4 : 2,
    hierarchy: 3,
    typographicCraft: systemfont ? 2 : 4,
    motionCohesion: motionDefault ? 2 : 4,
    detailDensity: 3,
    antiTemplate: Math.max(1, 5 - antiCount),
  };

  const values = Object.values(rubrics);
  const overall = round2(values.reduce((a, b) => a + b, 0) / values.length);
  return { rubrics, overall };
}
