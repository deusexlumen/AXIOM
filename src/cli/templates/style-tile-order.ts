import type { WorkOrder } from "@/cli/schemas/work-order.js";

export function styleTileOrder(directionId: string): WorkOrder {
  return {
    orderId: `style-tile-${directionId}`,
    visionId: "brief-direction",
    goal: `Produce a static Style-Tile comp for ${directionId} including typography probe, color world, hero snippet, and motion description.`,
    scope: {
      writeAllowed: [
        `src/style-tiles/${directionId}.tsx`,
        `src/style-tiles/${directionId}.spec.json`,
        `src/style-tiles/${directionId}.test.tsx`,
      ],
      readContext: `axm context slice --for src/style-tiles/${directionId}.tsx`,
    },
    dependsOn: [],
    produces: { components: [`${directionId}StyleTile`] },
    acceptance: {
      pipelineScope: `style-tile-${directionId}`,
      gherkin: [
        "Component renders data-axm-id attribute",
        "All colors reference CSS custom properties",
        "All type sizes use fluid token clamp values",
      ],
    },
    tokenBudget: 8000,
    leaseRequired: true,
    status: "OPEN",
    claimedBy: null,
    attempts: { current: 0, max: 2 },
    agentInstruction: "Create the Sidecar first, then implement the Style-Tile component. Use only tokens from src/generated/theme.css and motion from src/generated/motion.ts.",
  };
}
