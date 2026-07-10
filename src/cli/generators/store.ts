export type StoreShape = Record<string, "string" | "number" | "boolean">;

function capitalize(value: string): string {
  return value[0]!.toUpperCase() + value.slice(1);
}

export function generateStore(name: string, shape: StoreShape): string {
  const capitalized = capitalize(name);
  const fields = Object.entries(shape)
    .map(([k, t]) => `  ${k}: z.${t}(),`)
    .join("\n");
  const defaults = Object.entries(shape)
    .map(([k, t]) => `    ${k}: ${t === "boolean" ? "false" : t === "number" ? "0" : '""'},`)
    .join("\n");
  const body = defaults.length > 0 ? `({\n${defaults}\n  })` : "({})";
  return `// src/state/${name}Store.ts — AXIOM AGENT ZONE\nimport { create } from "zustand";\nimport { z } from "zod";\n\nexport const ${capitalized}Shape = z.object({\n${fields}\n});\n\nexport type ${capitalized}State = z.infer<typeof ${capitalized}Shape>;\n\nexport const use${capitalized} = create<${capitalized}State>(() => ${body});\n`;
}
