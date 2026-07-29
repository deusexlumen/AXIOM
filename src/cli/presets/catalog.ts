import type { BriefJson } from "@/cli/schemas/brief.js";
import type { Preset } from "@/cli/presets/types.js";
import { SLOW_PRESETS } from "@/cli/presets/preset-slow.js";
import { MID_PRESETS } from "@/cli/presets/preset-mid.js";
import { FAST_PRESETS } from "@/cli/presets/preset-fast.js";

export const PRESETS: Preset[] = [...SLOW_PRESETS, ...MID_PRESETS, ...FAST_PRESETS];

const MOOD_MATCH_WEIGHT = 10;
const ANTI_HIT_PENALTY = 3;
const WEBGL_DISTANCE_PENALTY = 1;

export function selectPresetForBrief(brief: BriefJson): Preset {
  const words = brief.mood.words.map((w) => w.toLowerCase());
  const anti = brief.mood.antiWords.map((w) => w.toLowerCase());
  const appetite = brief.webglAppetite;

  const first = PRESETS[0];
  if (!first) throw new Error("Empty preset catalog");
  let best = first;
  let bestScore = -Infinity;
  for (const preset of PRESETS) {
    const matches = preset.moodMatch.filter((m) => words.includes(m)).length;
    const antiHits = preset.antiMatch.filter((m) => anti.includes(m)).length;
    const webglDist = Math.abs(preset.webglLevel - appetite);
    const score = matches * MOOD_MATCH_WEIGHT - antiHits * ANTI_HIT_PENALTY - webglDist * WEBGL_DISTANCE_PENALTY;
    if (score > bestScore) {
      bestScore = score;
      best = preset;
    }
  }
  return best;
}

export function getPresetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.directionId === id);
}
