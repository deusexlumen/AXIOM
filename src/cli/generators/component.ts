import type { SpecInput, GeneratedComponent } from "@/cli/generators/types.js";
import { defaultForProp, propTypeToZod, testValueForProp } from "@/cli/generators/component-helpers.js";

const PLACEHOLDER_HASH = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

export function generateComponent(name: string, spec: SpecInput): GeneratedComponent {
  const propEntries = Object.entries(spec.props);
  const propNames = propEntries.map(([k]) => k);

  const hasProps = propNames.length > 0;

  const propSchemaLines = propEntries.map(([k, p]) => `  ${k}: ${propTypeToZod(p)},`);
  const propsSchema = `const ${name}Props = z.object({\n${propSchemaLines.join("\n")}\n});`;

  const destructured = propNames
    .map((n) => {
      const def = defaultForProp(spec.props[n]!);
      return def !== undefined ? `${n} = ${def}` : n;
    })
    .join(", ");
  const signature = hasProps ? `{ ${destructured} }: Props` : "";

  const propsSection = hasProps
    ? `import { z } from "zod";\n\n${propsSchema}\n\ntype Props = z.infer<typeof ${name}Props>;\n\n`
    : "";

  const componentTs = `// src/components/${name}.tsx — AXIOM AGENT ZONE\n// Vertrag: ./${name}.spec.json | Invarianten: I-01..I-13\n${propsSection}export function ${name}(${signature}) {\n  return (\n    <div data-axm-id="${name}">\n      {/* AGENT: implement component, only token-based Tailwind classes (I-08) */}\n    </div>\n  );\n}\n`;

  const renderProps = propNames.map((n) => `${n}={${testValueForProp(spec.props[n]!)}}`).join(" ");
  const contractTests = propEntries
    .filter(([_, p]) => p.required)
    .map(([k]) => {
      const otherProps = propNames
        .filter((n) => n !== k)
        .map((n) => `${n}={${testValueForProp(spec.props[n]!)}}`)
        .join(" ");
      return `  it("requires ${k}", () => {\n    const { container } = render(<${name} ${otherProps} />);\n    expect(container).toBeTruthy();\n  });`;
    })
    .join("\n");

  const testTs = `// src/components/${name}.test.tsx — AXIOM AGENT ZONE\nimport { render } from "@testing-library/react";\nimport { describe, it, expect } from "vitest";\nimport { ${name} } from "@/components/${name}";\n\n// @axiom:contract:start ${PLACEHOLDER_HASH}\ndescribe("${name} [contract]", () => {\n  it("renders with data-axm-id", () => {\n    const { container } = render(<${name} ${renderProps} />);\n    expect(container.querySelector('[data-axm-id="${name}"]')).not.toBeNull();\n  });\n${contractTests}\n});\n// @axiom:contract:end\n`;

  const specJson = `${JSON.stringify(spec, null, 2)}\n`;

  return { component: componentTs, spec: specJson, test: testTs };
}

export function defaultComponentSpec(name: string): SpecInput {
  return {
    name,
    description: `${name} component`,
    props: {},
    states: [],
    a11y: { role: "generic", focusable: false, requiredAria: [] },
    tokensUsed: [],
    forbidden: [],
  };
}
