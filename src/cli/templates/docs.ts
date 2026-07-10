import type { AgentContext } from "@/cli/schemas/agent-context.js";

export function cursorRules(context: AgentContext): string {
  return `# AXIOM Agent Rules — ${context.project.name}

# Stack
- Runtime: Node.js 22, Package Manager: pnpm 9, Build: Vite 6
- UI: React 19 (Function Components), Styling: Tailwind v4
- State: Zustand 5, Schema: Zod 4
- Tests: Vitest 3, E2E: Playwright + axe-core
- API Runtime: Hono 4 (planned), ORM: Drizzle ORM (planned)

# Cardinal Rules
1. Lies zuerst agent-context.json, nicht das Repo.
2. Ein FIX_PACKET = eine Korrektur = ein Re-Run.
3. Splitte Dateien statt Budgets zu überschreiten.
4. Frag das Ledger, bevor du entscheidest. (M10/M11)

# Invariants
- I-01: Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare)
- I-02: Max. 4096 Bytes pro Quelldatei
- I-03: Genau ein benannter Export pro Komponenten-Datei
- I-04: Keine Default-Exports (außer generierte Route-Wrapper)
- I-05: Keine Barrel-Files (index.ts mit Re-Exports)
- I-06: Imports ausschließlich absolut via Alias @/
- I-07: Jede Komponente besitzt eine Sidecar-Datei <Name>.spec.json
- I-08: Keine Raw-Farbwerte/Pixel; nur Token-Referenzen
- I-09: Kein any, kein @ts-ignore, kein eslint-disable
- I-10: Verzeichnisse haben Ownership-Zonen
- I-11: Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema
- I-12: Keine dynamischen Imports mit variablen Pfaden
- I-13: Jede Komponente rendert data-axm-id="<Name>" auf dem Root-JSX-Element

# Ownership Zones
- LOCKED: src/core/, axiom.config.json
- MACHINE: src/generated/, .cursorrules, CLAUDE.md, agent-context.json
- AGENT: src/components/, src/state/, e2e/
- OPERATOR: tokens.json, VISION.axm.json

# CLI Cheat Sheet
- axm add component <Name>
- axm add route <path> --component <Name>
- axm add store <name> --shape <json>
- axm validate
- axm pipeline run
- axm context slice --for <file>
- axm split <file> --at <export|line>
- axm heal --auto
- axm tokens build
`;
}

export function claudeMd(context: AgentContext): string {
  return `# AXIOM Agent Onboarding — ${context.project.name}

## Cardinal Rules
1. Lies das Manifest (\`agent-context.json\`), nicht das Repo.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite Budgets nicht; verwende \`axm split\`.
4. Frag das Ledger, bevor du entscheidest. (M10/M11)

## Invariants
| ID | Invariante |
|----|------------|
| I-01 | Max. 120 LOC pro Datei (ohne Leerzeilen/Kommentare) |
| I-02 | Max. 4096 Bytes pro Quelldatei |
| I-03 | Genau ein benannter Export pro Komponenten-Datei |
| I-04 | Keine Default-Exports (außer generierte Route-Wrapper) |
| I-05 | Keine Barrel-Files (\`index.ts\` mit Re-Exports) |
| I-06 | Imports ausschließlich absolut via Alias \`@/\` |
| I-07 | Jede Komponente besitzt eine Sidecar-Datei \`<Name>.spec.json\` |
| I-08 | Keine Raw-Farbwerte/Pixel; nur Token-Referenzen |
| I-09 | Kein \`any\`, kein \`@ts-ignore\`, kein \`eslint-disable\` |
| I-10 | Verzeichnisse haben Ownership-Zonen |
| I-11 | Jeder CLI-Output ist NDJSON; jeder Fehler folgt dem FIX_PACKET-Schema |
| I-12 | Keine dynamischen Imports mit variablen Pfaden |
| I-13 | Jede Komponente rendert \`data-axm-id="<Name>"\` auf dem Root-JSX-Element |

## Ownership Zones
- **LOCKED:** \`src/core/\`, \`axiom.config.json\` — Nur Framework-Updates.
- **MACHINE:** \`src/generated/\`, \`.cursorrules\`, \`CLAUDE.md\`, \`agent-context.json\` — Nur via \`axm\`-CLI.
- **AGENT:** \`src/components/\`, \`src/state/\`, \`e2e/\` — Freie Schreibzone unter Invarianten.
- **OPERATOR:** \`tokens.json\`, \`VISION.axm.json\` — Mensch editiert.

## CLI Cheat Sheet
- \`axm add component <Name>\`
- \`axm add route <path> --component <Name>\`
- \`axm add store <name> --shape <json>\`
- \`axm validate\`
- \`axm pipeline run\`
- \`axm context slice --for <file>\`
- \`axm split <file> --at <export|line>\`
- \`axm heal --auto\`
- \`axm tokens build\`

## Order / Lease Protocol (M8/M9)
- TODO: Slot-Lease-Protokoll für parallele Agenten.

## Ledger Rule (M10/M11)
- TODO: Vor jeder Entscheidung das Ledger konsultieren.
`;
}
