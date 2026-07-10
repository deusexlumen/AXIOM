import type { ComponentSpec } from "@/cli/schemas/component-spec.js";

export interface GeneratedComponent {
  component: string;
  spec: string;
  test: string;
}

export type SpecInput = ComponentSpec;
