import type { DirectionJson } from "@/cli/schemas/direction.js";

export interface Preset extends DirectionJson {
  moodMatch: string[];
  antiMatch: string[];
}
