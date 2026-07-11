import type { MotionJson } from "@/cli/schemas/motion.js";

function easeTuple(curve: [number, number, number, number]): string {
  return `[${curve.join(", ")}] as const`;
}

export function motionTs(motion: MotionJson): string {
  const max = motion.dur.max;
  if (max === undefined) {
    throw new Error("Missing required dur.max cap");
  }
  const lines: string[] = [];
  lines.push("export const motion = {");
  lines.push("  ease: {");
  for (const [key, item] of Object.entries(motion.ease)) {
    lines.push(`    ${key}: ${easeTuple(item.curve)},`);
  }
  lines.push("  },");
  lines.push("  dur: {");
  for (const [key, value] of Object.entries(motion.dur)) {
    lines.push(`    ${key}: ${value},`);
  }
  lines.push("  },");
  lines.push("  stagger: {");
  for (const [key, value] of Object.entries(motion.stagger)) {
    lines.push(`    ${key}: ${value},`);
  }
  lines.push("  },");
  lines.push(`  scroll: ${JSON.stringify(motion.scroll)},`);
  lines.push("  transitions: {");
  for (const [key, item] of Object.entries(motion.transitions)) {
    const dur = motion.dur[item.dur];
    if (dur === undefined) {
      throw new Error(`Missing dur reference "${item.dur}" in transition "${key}"`);
    }
    if (dur > max) {
      throw new Error(`Duration ${dur} for transition "${key}" exceeds dur.max ${max}`);
    }
    const ease = motion.ease[item.ease];
    if (ease === undefined) {
      throw new Error(`Missing ease reference "${item.ease}" in transition "${key}"`);
    }
    lines.push(
      `    ${key}: { grammar: "${item.grammar}", dur: ${dur}, ease: ${easeTuple(ease.curve)} },`,
    );
  }
  lines.push("  },");
  lines.push(`  choreography: ${JSON.stringify(motion.choreography)},`);
  lines.push(`  reducedMotion: ${JSON.stringify(motion.reducedMotion)},`);
  lines.push("} as const;");
  lines.push("");
  lines.push("export type Motion = typeof motion;");
  return lines.join("\n");
}
