# ATELIER A7 — Acceptance Report

**Meilenstein:** A7 — CRITIC-Stage + Anti-Template-Heuristik + MCP-Server  
**Datum:** 2026-07-12  
**Branch:** feat/m2  
**Worktree:** C:/Users/Buxe/Projects/AXIOM/.worktrees/m2  
**Status:** GREEN

## Abnahmekriterien (aus ATELIER_SPEC_v3.0.md)

| Kriterium | Status | Nachweis |
|---|---|---|
| CRITIC-Stage als advisory Stage nach PERF | ✅ | `src/cli/pipeline/select-stages.ts` fügt `critic` nach `perf` ein; `src/cli/pipeline/stages/critic.ts` gibt immer `{ ok: true }` zurück |
| CRITIC_REPORT.json mit sechs Rubriken (1–5), overall, findings, heuristicFindings, model, timestamp | ✅ | `src/cli/schemas/critic-report.ts` definiert das Schema; wird in Stage und CLI validiert |
| Anti-Template-Heuristik erkennt Generik-Signaturen | ✅ | `src/cli/critic/anti-template.ts` prüft Systemfont, Default-Tailwind-Palette, Hero+Badge+CTA, Inter+Blau+Karten-Raster, fehlende Custom-Easings |
| `atl critic run [--route <path>]` verfügbar | ✅ | `src/cli/commands/registry.ts` registriert `critic`; `package.json` enthält `atl`-Bin neben `axm` |
| MCP-Server `atelier-mcp` als dünner CLI-Wrapper | ✅ | `src/cli/mcp/server.ts` nutzt `@modelcontextprotocol/sdk` und ruft `getCommandHandler` auf |
| 15 MCP-Tools exponiert | ✅ | `src/cli/mcp/tools.ts` listet `atelier_brief_elicit`, `atelier_brief_validate`, `atelier_direct_generate`, `atelier_direct_choose`, `atelier_direct_amend`, `atelier_tokens_build`, `atelier_motion_build`, `atelier_pattern_add`, `atelier_pattern_list`, `atelier_pattern_eject`, `atelier_critic_run`, `atelier_validate`, `atelier_pipeline_run`, `atelier_context_slice`, `atelier_deploy` |
| CLI≡MCP-Golden-Test | ✅ | `src/cli/mcp/server.test.ts` vergleicht CLI- und MCP-Ausgaben für `tokens build`, `motion build`, `pattern list`, `critic run`, `brief validate`, `direct choose` |
| CRITIC-Report schema-valide auf 3 Fixture-Sites | ✅ | `src/cli/commands/critic.test.ts` testet Generic-Site, init-Scaffold und curated Direction-Preset |
| Heuristik erkennt präparierte Generik-Site | ✅ | `src/cli/critic/anti-template.test.ts` zeigt ≥4 Findings auf der Generic-Site |

## Testergebnis

```
pnpm build  → tsc && tsc-alias: OK
pnpm test   → 176 tests passed, 0 failed, 124 suites passed
```

## Wesentliche Dateien

- `src/cli/schemas/critic-report.ts`
- `src/cli/critic/anti-template.ts`
- `src/cli/critic/check-systemfont.ts`
- `src/cli/critic/check-tailwind-defaults.ts`
- `src/cli/critic/check-generic-hero.ts`
- `src/cli/critic/check-inter-blue-card.ts`
- `src/cli/critic/check-custom-easings.ts`
- `src/cli/critic/collect-files.ts`
- `src/cli/critic/score.ts`
- `src/cli/pipeline/stages/critic.ts`
- `src/cli/commands/critic.ts`
- `src/cli/mcp/server.ts`
- `src/cli/mcp/tools.ts`
- `src/cli/mcp/capture.ts`
- `src/cli/mcp/server.test.ts`
- `src/cli/critic/anti-template.test.ts`
- `src/cli/commands/critic.test.ts`
- `src/cli/pipeline/stages/critic.test.ts`

## Invarianten-Compliance

- Keine Default-Exports in Implementierungsdateien
- Keine Barrel-Files unter `src/cli/critic/` oder `src/cli/mcp/`
- Keine `any`-Typen
- Keine `eslint-disable`- oder `@ts-ignore`-Kommentare
- Alle neuen Quelldateien < 120 LOC und < 4096 Bytes
- Imports ausschließlich über `@/`-Alias

## Bekannte Einschränkungen / P1-Follow-up

- CRITIC ist aktuell rein heuristikbasiert; ein optionaler LLM-Endpoint ist im Schema vorbereitet (`model`), aber nicht implementiert. Damit bleibt der CRITIC-Score deterministisch, bis ein Kalibrierungssatz (P1 aus §15) vorliegt.
- `checkInterBlueCard` nutzt ein Substring-Match für "Inter", das bei Variablen-Font-Namen wie "InterVariable" false-positiven kann. Für Track-B-Bespoke-Projekte mit eigener Variable-Font-Namensgebung sollte die Prüfung verschärft werden.

## Review-Verlauf

- Implementer-Subagent: A7 Teil 1 + Teil 2
- Spec-Review Teil 1: 3 Gaps identifiziert und geschlossen (`atl`-Bin, Systemfont-Scan, Tailwind-TSX-Scan)
- Code-Quality-Review Teil 1: 2 wichtige Issues behoben (Systemfont-Tokenizer, Easing-Runtime-Guard)
- Spec-Review Teil 2: compliant
- Code-Quality-Review Teil 2: 6 Issues behoben (`CliError`-Parsing, `capture.ts`-Robustheit, Testabdeckung)
- Final-Review gesamte A7: approved

## Entscheidung

A7 ist GREEN und bereit für die Integration in `feat/m2`.
