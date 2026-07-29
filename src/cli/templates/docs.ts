import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function cursorRules(context: AgentContext): string {
  return `# ATELIER Agent Rules — ${context.project.name}
# Stack
Node.js 22, pnpm 9, Next.js 15 (App Router, static export); React 19 FC, Tailwind v4; GSAP 3.15 + ScrollTrigger, Lenis 1.3.25; React Three Fiber 9.6 + drei 10.7 + Three.js 0.185; GLSL raw-loader; Zustand 5, Zod 4; Vitest 4, Playwright + axe-core.
# Cardinal Rules
1. Lies agent-context.json zuerst.
2. Ein FIX_PACKET = eine Korrektur = ein Re-Run.
3. Splitte statt Budgets zu überschreiten.
4. Motion nur via useChoreo/<Stage>; kein roher GSAP/Three-Import außerhalb src/core/.
# Invariants
- I-01: Max. 120 LOC/Datei (ohne Leerzeilen/Kommentare)
- I-02: Max. 4096 Bytes/Quelldatei
- I-03: Genau ein benannter Export pro Komponente
- I-04: Keine Default-Exports (außer app/layout.tsx, app/page.tsx, next.config.ts)
- I-05: Keine Barrel-Files (index.ts mit Re-Exports)
- I-06: Imports nur absolut via Alias @/
- I-07: Jede Komponente hat Sidecar <Name>.spec.json
- I-08: Keine Raw-Farbwerte/Pixel; nur Token-Referenzen
- I-09: Kein any, @ts-ignore, eslint-disable
- I-10: Verzeichnisse haben Ownership-Zonen
- I-11: CLI-Output = NDJSON; Fehler folgen FIX_PACKET-Schema
- I-12: Keine dynamischen Imports mit variablen Pfaden
- I-13: Root-JSX rendert data-axm-id="<Name>"
- I-18: Kein GSAP/Three-Import außerhalb useChoreo/<Stage>
- I-19: Jede Animation deklariert reduced-motion-Verhalten
- I-20: DIRECTION/MOTION/SCENOGRAPHY nach Freeze hash-versiegelt
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
1. Lies \`agent-context.json\` zuerst.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite keine Budgets; nutze \`axm split\`.
4. Motion nur über \`useChoreo\`/\`<Stage>\` — niemals rohe GSAP/Three-Imports außerhalb \`src/core/\`.
## Invariants
| ID | Invariante |
|----|------------|
| I-01 | Max. 120 LOC/Datei (ohne Leerzeilen/Kommentare) |
| I-02 | Max. 4096 Bytes/Quelldatei |
| I-03 | Genau ein benannter Export pro Komponente |
| I-04 | Keine Default-Exports (außer \`app/layout.tsx\`, \`app/page.tsx\`, \`next.config.ts\`) |
| I-05 | Keine Barrel-Files (\`index.ts\` mit Re-Exports) |
| I-06 | Imports nur absolut via Alias \`@/\` |
| I-07 | Jede Komponente hat Sidecar \`<Name>.spec.json\` |
| I-08 | Keine Raw-Farbwerte/Pixel; nur Token-Referenzen |
| I-09 | Kein \`any\`, \`@ts-ignore\`, \`eslint-disable\` |
| I-10 | Verzeichnisse haben Ownership-Zonen |
| I-11 | CLI-Output = NDJSON; Fehler folgen FIX_PACKET-Schema |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |
| I-13 | Root-JSX rendert \`data-axm-id="<Name>"\` |
| I-18 | Kein GSAP/Three-Import außerhalb \`useChoreo\`/\`<Stage>\` |
| I-19 | Jede Animation deklariert reduced-motion-Verhalten |
| I-20 | \`DIRECTION\`/\`MOTION\`/\`SCENOGRAPHY\` nach Freeze hash-versiegelt |
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
