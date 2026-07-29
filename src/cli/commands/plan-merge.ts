export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, val] of Object.entries(source)) {
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      target[key] !== null &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key] as Record<string, unknown>, val as Record<string, unknown>);
    } else {
      target[key] = val;
    }
  }
}
