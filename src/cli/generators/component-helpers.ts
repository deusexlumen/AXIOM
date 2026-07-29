import type { SpecInput } from "@/cli/generators/types.js";

export function propTypeToZod(prop: SpecInput["props"][string]): string {
  switch (prop.type) {
    case "string":
      return `z.string()${prop.constraints?.minLength ? `.min(${prop.constraints.minLength})` : ""}${prop.constraints?.maxLength ? `.max(${prop.constraints.maxLength})` : ""}`;
    case "number":
      return `z.number()${prop.constraints?.min ? `.min(${prop.constraints.min})` : ""}${prop.constraints?.max ? `.max(${prop.constraints.max})` : ""}`;
    case "boolean":
      return "z.boolean()";
    case "enum":
      return `z.enum([${prop.values.map((v) => `"${v}"`).join(", ")}])${prop.default ? `.default("${prop.default}")` : ""}`;
    case "function":
      return "z.function()";
  }
}

export function defaultForProp(prop: SpecInput["props"][string]): string | undefined {
  if (prop.type === "boolean") return String(prop.default ?? false);
  if (prop.type === "enum") return prop.default ? `"${prop.default}"` : undefined;
  return undefined;
}

export function testValueForProp(prop: SpecInput["props"][string]): string {
  switch (prop.type) {
    case "string":
      return '""';
    case "number":
      return String(prop.constraints?.min ?? 0);
    case "boolean":
      return String(prop.default ?? false);
    case "enum":
      return `"${prop.default ?? prop.values[0]!}"`;
    case "function":
      return "() => {}";
  }
}
