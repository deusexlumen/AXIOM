export function cursorRules(): string {
  return `# AXIOM Agent Rules
- Lies zuerst agent-context.json, nicht das Repo.
- Ein FIX_PACKET = eine Korrektur = ein Re-Run.
- Splitte Dateien statt Budgets zu überschreiten.
- Keine Default-Exports, keine Barrel-Files, nur @/-Imports.
- Keine Raw-Farbwerte, keine Pixel, keine dynamischen Imports.
`;
}

export function claudeMd(): string {
  return `# AXIOM Agent Onboarding

## Kardinalregeln
1. Lies das Manifest (\`agent-context.json\`), nicht das Repo.
2. Ein FIX_PACKET adressiert genau eine Fehlerklasse.
3. Überschreite Budgets nicht; verwende \`axm split\`.

## Invarianten
- I-01: Max 120 LOC/Datei
- I-02: Max 4096 Bytes/Datei
- I-03: Ein benannter Export pro Komponente
- I-04: Keine Default-Exports
- I-05: Keine Barrel-Files
- I-06: Nur @/-Imports
- I-07: Jede Komponente hat ein .spec.json
- I-08: Nur Token-Referenzen
- I-09: Kein any, @ts-ignore, eslint-disable
- I-10: Ownership-Zonen beachten
- I-11: CLI-Output = NDJSON
- I-12: Keine dynamischen Imports mit variablen Pfaden

## CLI-Spickzettel
- axm add component <Name>
- axm add route <path> --component <Name>
- axm validate
- axm pipeline run
- axm context slice --for <file>
- axm split <file> --at <export|line>
`;
}
