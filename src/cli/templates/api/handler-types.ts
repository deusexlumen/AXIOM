export function handlerTypesTs(contractNames: string[]): string {
  if (contractNames.length === 0) {
    return `export type HandlerFor<T extends string> = { input: unknown; output: unknown };
`;
  }
  const imports = contractNames
    .map((name) => `import type { ${name}Contract } from "@/api/contracts/${name}.contract";`)
    .join("\n");
  const entries = contractNames
    .map(
      (name) =>
        `  & { [K in keyof typeof ${name}Contract.routes as \`${name}.\${K & string}\`]: { input: typeof ${name}Contract.routes[K]["input"]; output: typeof ${name}Contract.routes[K]["output"] }; }`
    )
    .join("\n");
  return `${imports}

type RouteMap =
${entries};

export type HandlerFor<T extends string> = T extends keyof RouteMap ? RouteMap[T] : never;
`;
}
