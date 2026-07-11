import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function cursorRules(context: AgentContext): string {
  return `# ATELIER Agent Rules — ${context.project.name}

# Stack
- Runtime: Node.js 22, Package Manager: pnpm 9, Meta-Framework: Next.js 15 (App Router, static export)
- UI: React 19 (Function Components), Styling: Tailwind v4
- Motion: GSAP 3.15 + ScrollTrigger, Smooth Scroll: Lenis 1.3.25
- WebGL: React Three Fiber 9.6 + drei 10.7 + Three.js 0.185
- Shader: GLSL via raw-loader, State: Zustand 5, Schema: Zod 4
- Tests: Vitest 4, E2E: Playwright + axe-core

# Cardinal Rules
1. Lies zuerst agent-context.json, nicht das Repo.
2. Ein FIX_PACKET = eine Korrektur = ein Re-Run.
3. Splitte Dateien statt Budgets zu überschreiten.
4. Motion nur über useChoreo / <Stage> — niemals rohe GSAP/Three-Imports außerhalb von src/core/.

# Invariants
- I-01: Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare)
- I-02: Max. 4096 Bytes pro Quelldatei
- I-03: Genau ein benannter Export pro Komponenten-Datei
- I-04: Keine Default-Exports (außer app/layout.tsx, app/page.tsx, next.config.ts)
- I-05: Keine Barrel-Files (index.ts mit Re-Exports)
- I-06: Imports ausschließlich absolut via Alias @/
- I-07: Jede Komponente besitzt eine Sidecar-Datei <Name>.spec.json
- I-08: Keine Raw-Farbwerte/Pixel; nur Token-Referenzen
- I-09: Kein any, kein @ts-ignore, kein eslint-disable
- I-10: Verzeichnisse haben Ownership-Zonen
- I-11: Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema
- I-12: Keine dynamischen Imports mit variablen Pfaden
- I-13: Jede Komponente rendert data-axm-id="<Name>" auf dem Root-JSX-Element
- I-18: Kein GSAP/Three-Import außerhalb von useChoreo / <Stage> Core-Wrappers
- I-19: Jede Animation deklariert reduced-motion-Verhalten
- I-20: DIRECTION/MOTION/SCENOGRAPHY sind nach Freeze hash-versiegelt

# Ownership Zones
- LOCKED: src/core/, app/, axiom.config.json
- MACHINE: src/generated/, .cursorrules, CLAUDE.md, agent-context.json, next.config.ts
- AGENT: src/components/, src/state/, e2e/
- OPERATOR: tokens.json, MOTION.axm.json, DIRECTION.axm.json

# CLI Cheat Sheet
- axm add component <Name>
- axm validate
- axm pipeline run
- axm tokens build
- axm context slice --for <file>
- axm split <file> --at <export|line>
- axm heal --auto
`;
}

export function claudeMd(context: AgentContext): string {
  return `# ATELIER Agent Onboarding — ${context.project.name}

## Cardinal Rules
1. Lies das Manifest (\`agent-context.json\`), nicht das Repo.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite Budgets nicht; verwende \`axm split\`.
4. Motion nur über \`useChoreo\` / \`<Stage>\` — niemals rohe GSAP/Three-Imports außerhalb von \`src/core/\`.

## Invariants
| ID | Invariante |
|----|------------|
| I-01 | Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare) |
| I-02 | Max. 4096 Bytes pro Quelldatei |
| I-03 | Genau ein benannter Export pro Komponenten-Datei |
| I-04 | Keine Default-Exports (außer \`app/layout.tsx\`, \`app/page.tsx\`, \`next.config.ts\`) |
| I-05 | Keine Barrel-Files (\`index.ts\` mit Re-Exports) |
| I-06 | Imports ausschließlich absolut via Alias \`@/\` |
| I-07 | Jede Komponente besitzt eine Sidecar-Datei \`<Name>.spec.json\` |
| I-08 | Keine Raw-Farbwerte/Pixel; nur Token-Referenzen |
| I-09 | Kein \`any\`, kein \`@ts-ignore\`, kein \`eslint-disable\` |
| I-10 | Verzeichnisse haben Ownership-Zonen |
| I-11 | Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |
| I-13 | Jede Komponente rendert \`data-axm-id="<Name>"\` auf dem Root-JSX-Element |
| I-18 | Kein GSAP/Three-Import außerhalb von \`useChoreo\` / \`<Stage>\` Core-Wrappers |
| I-19 | Jede Animation deklariert reduced-motion-Verhalten |
| I-20 | \`DIRECTION\` / \`MOTION\` / \`SCENOGRAPHY\` sind nach Freeze hash-versiegelt |

## Ownership Zones
- **LOCKED:** \`src/core/\`, \`app/\`, \`axiom.config.json\` — Nur Framework-Updates.
- **MACHINE:** \`src/generated/\`, \`.cursorrules\`, \`CLAUDE.md\`, \`agent-context.json\`, \`next.config.ts\` — Nur via \`axm\`-CLI.
- **AGENT:** \`src/components/\`, \`src/state/\`, \`e2e/\` — Freie Schreibzone unter Invarianten.
- **OPERATOR:** \`tokens.json\`, \`MOTION.axm.json\`, \`DIRECTION.axm.json\` — Mensch editiert.

## CLI Cheat Sheet
- \`axm add component <Name>\`
- \`axm validate\`
- \`axm pipeline run\`
- \`axm tokens build\`
- \`axm context slice --for <file>\`
- \`axm split <file> --at <export|line>\`
- \`axm heal --auto\`
`;
}
