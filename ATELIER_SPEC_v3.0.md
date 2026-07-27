# ATELIER — Agency-Grade Web Experience Engine
## Implementierungs-Spezifikation v3.0 (KURSKORREKTUR)

**Status:** BUILD-READY
**Verhältnis zu AXIOM v2.0:** AXIOM bleibt als **Substrat** bestehen (Manifeste, Pipeline, FIX_PACKETs, Orders, Leases — alles Kapitel-referenziert, nichts wird doppelt gespect). ATELIER ist die **Craft-Schicht darüber** — das, worum es eigentlich geht.
**Doktrin erweitert:** Determinismus > Eleganz gilt weiter für die Maschine. Für das Ergebnis gilt neu: **Distinktion > Konvention.** Eine Seite, die aussieht wie jede andere agentengenerierte Seite, ist ein Pipeline-Fehler — auch wenn alle Tests grün sind.

---

## 0. KURSKORREKTUR — was v2 verfehlt hat

**Diagnose:** v2 spezifizierte ein exzellentes Fließband — für das falsche Produkt. Es baut deterministische CRUD-Apps mit korrekten Buttons. Die Vision ist aber: **Websites auf dem Niveau von Active Theory, Locomotive, dogstudio, darkroom.engineering** — immersiv, WebGL-getrieben, choreografierte Motion, Erlebnisse nahe an einem Game. Das Preissegment, das dieses Framework demokratisieren soll: vier- bis fünfstellige Agentur-Rechnungen.

**Traceability — Vision → Anforderung:**

| Deine Formulierung | Anforderung | Spec-Kapitel |
|---|---|---|
| „hochprofessionelle, agenturgleiche Webseiten… Active Theory… fast ein Game" | Qualitätsziel = Award-Site-Niveau (Awwwards/FWA-Klasse), WebGL + Motion als Kernkompetenz | §1, §6, §8 |
| „zwei Möglichkeiten: fertiger Code / eigenes Ding, eigene Brand" | **Track A (CURATED):** parametrische Signature-Patterns. **Track B (BESPOKE):** volle Kreativ-Pipeline. | §4 |
| „wie so eine Agentur… explizite Workflows für Design" | Agentur-Prozess als maschinenlesbarer Workflow: Discovery → Direction → Design System → Motion Language → Build → Polish | §5 |
| „User gibt seine Vision/Informationen rein… was braucht der User, was stellst du dir vor" | Strukturiertes Brief-Elicitation-Protokoll (der Agent führt das Discovery-Interview) | §5.1 |
| „verbunden mit CLI-KI… Codex oder was auch immer, egal was man benutzt" | **Agent-agnostisch:** CLI + MCP-Server, generierte Kontextdateien für alle Ökosysteme (CLAUDE.md, AGENTS.md, .cursorrules) | §3 |
| „erst mal Animationen generell, hochwertig, immersiv" | Motion als First-Class-Tokensystem + Motion-Lint + 60fps-Gate. Video-Generierung = explizites v4-Nicht-Ziel. | §7, §9, §13 |

**Was aus v2 überlebt (unverändert, per Referenz):** Manifest-SSOT, Ownership-Zonen, FIX_PACKET/ESCALATION, Pipeline-State-Machine, Work-Order-DAG, Veto-Gates, Leases/Multi-Agent, Ledger, Security, Token-Slicing. **Was degradiert wird:** die API/DB-Schicht (v2 §M7) — Agentur-Sites sind überwiegend statisch; übrig bleibt ein Minimal-Modul (Formulare/Kontakt). **Was fällt:** nichts wird gelöscht, aber der Bauplan wird neu priorisiert (§14).

---

## 1. QUALITÄTSZIEL — operationalisiert

„Sieht aus wie Active Theory" ist kein Abnahmekriterium. Das hier schon:

| Dimension | Messbares Ziel | Gate |
|---|---|---|
| **Motion-Flüssigkeit** | p95 Frame-Time ≤ 16,7 ms während skriptgesteuerter Scroll-/Interaktions-Szenarien | PERF-Stage (deterministisch, blockierend) |
| **Ladeerlebnis** | LCP ≤ 2,5 s mit Preloader-Choreografie; kein Layout-Shift nach Preloader (CLS ≤ 0,02) | PERF-Stage |
| **WebGL-Disziplin** | Drawcall-/Texturspeicher-Budget pro Szene aus SCENOGRAPHY.json eingehalten | PERF-Stage |
| **Motion-Kohärenz** | 100 % der Tweens referenzieren Motion-Tokens; null Default-Easings | MOTION-LINT (deterministisch, blockierend) |
| **Immersion ohne Ausschluss** | Jede Animation hat einen prefers-reduced-motion-Pfad; Tastatur-Navigation durch alle Szenen | A11Y-Gate (blockierend) |
| **Direction-Treue & Distinktion** | CRITIC-Score ≥ 4/5 auf Rubrik (Richtungstreue, Hierarchie, typografisches Handwerk, Motion-Kohäsion, Anti-Template) | CRITIC-Stage (advisory) + Operator-Veto (blockierend) |

**Ehrlichkeitsklausel:** Geschmack ist nicht deterministisch. Die Maschine garantiert Handwerk (Performance, Kohärenz, a11y, Systemtreue); die letzten 15 % Magie garantiert der Operator am Veto-Gate — genau wie in einer echten Agentur der Creative Director.

---

## 2. STACK-LOCK v3 (Craft-Schicht)

Anti-Halluzinations-Doktrin unverändert: der Award-Site-Stack mit dem größten Trainingskorpus.

| Layer | Entscheidung | Begründung (eine Zeile) |
|---|---|---|
| **Meta-Framework** | Next.js 15 (App Router, statischer Export als Default) | Größter Korpus; SEO/SSG für Landingpages; Client-Heavy-WebGL problemlos |
| **3D/WebGL** | Three.js + React Three Fiber + drei | DER Korpus für Web-3D; deklarativ = agentenfreundlich; WebGPU-Renderer als Flag, nicht Default |
| **Motion** | GSAP 3.13+ (inkl. ScrollTrigger, SplitText, Flip — seit Webflow-Übernahme vollständig frei) | Industriestandard jeder Award-Agentur; Timeline-Modell ist maschinell lintbar |
| **Smooth Scroll** | Lenis | De-facto-Standard der Szene (darkroom.engineering), minimal, ScrollTrigger-kompatibel |
| **Shader** | GLSL-Module via vite-plugin-glsl-Äquivalent für Next (raw-loader + glslify-Konvention) + pmndrs/postprocessing | Shader als eigene Dateien = eigene Invarianten-Klasse (§10) |
| **Styling** | Tailwind v4 für Layout-Utility **+ sanktioniertes Custom-CSS** für Kompositionen/Keyframes | Award-Ästhetik stirbt in Utility-only; §10 regelt die Grenze |
| **Typografie** | Variable Fonts, self-hosted; Fluid-Type-Scale via clamp() aus Tokens | Typo ist 60 % der wahrgenommenen Qualität; Systemfonts sind verboten |
| **Bilder** | sharp-Pipeline (Build-Zeit): AVIF/WebP, Blur-Placeholder, exakte Sizes | Kein layoutshiftendes Bild überlebt die Pipeline |
| **State/Schema/Test/Lint** | wie AXIOM v2 §1 (Zustand, Zod, Vitest, Playwright+axe, ESLint+Custom-Plugin) | Substrat |
| **Formulare (einziges Backend-Relikt)** | Ein Hono-Micro-Endpoint nach v2-Contract-Muster ODER Drittanbieter-Action | Landingpages brauchen selten mehr; v2 §M7 bleibt als optionales Modul aktivierbar |

**Verworfen:** Framer Motion als Primär-Engine (stark, aber Timeline-Choreografie + ScrollTrigger-Ökosystem sind GSAP-Territorium; zwei Motion-Engines = Inkohärenz — GSAP ist Diktat), Spline/No-Code-3D (nicht versionierbar, nicht lintbar), Anime.js/Motion One (Korpus/Featureset unterlegen), CSS-Scroll-Driven-Animations als Primärmechanik (Browser-Support-Kante; als Progressive Enhancement erlaubt).

---

## 3. AGENT-AGNOSTISCHE SCHNITTSTELLE

**Prinzip:** ATELIER weiß nicht, welches Modell es bedient. Es exponiert drei gleichwertige Zugänge:

1. **CLI `atl`** — Superset des `axm`-Substrats. NDJSON-only, Exit-Codes, FIX_PACKETs: identische Semantik (v2 §5). Jeder Coding-Agent, der ein Terminal bedienen kann (Claude Code, Codex, Cursor, Aider), ist damit vollständig arbeitsfähig.
2. **MCP-Server `atelier-mcp`** — dieselben Befehle als Tools (`atelier_brief_elicit`, `atelier_pattern_add`, …) für MCP-fähige Clients. Der MCP-Server ist ein dünner Wrapper um die CLI — eine Logik, zwei Transporte, null Drift (Golden-Test: CLI-Output ≡ MCP-Tool-Output).
3. **Generierte Kontextdateien** — `atl init` erzeugt und jede Mutation aktualisiert: `CLAUDE.md`, `AGENTS.md` (Codex-Konvention), `.cursorrules`. Inhalt identisch, Format ökosystemspezifisch. Kardinalregeln v3: „Lies das Manifest, nicht das Repo" / „Kein Tween ohne Token" / „Frag das Ledger" / **„Die DIRECTION ist Gesetz — wer sie ändern will, eskaliert."**

---

## 4. DIE ZWEI TRACKS

### Track A — CURATED (Geschwindigkeit)
Für Projekte ohne Bespoke-Anspruch: Komposition aus der **Signature-Pattern-Library** (§8). Entscheidend gegen den Template-Look: Patterns sind **token-parametrisch** — Typografie, Farben, Easings, Grain, Tempo werden aus der Projekt-DIRECTION injiziert. Dasselbe Pattern sieht in zwei Projekten verschieden aus, weil die Direction verschieden ist. Track A durchläuft eine verkürzte Pipeline: Mini-Brief → Direction-Preset wählen (kuratierte Presets, je ein vollständiges Token-Set) → Patterns komponieren → Gates.

### Track B — BESPOKE (der eigentliche Fokus)
Volle Agentur-Emulation nach §5. Eigene Brand, eigene Motion-Sprache, eigene WebGL-Szenografie. Patterns dürfen als Rohmaterial dienen, werden aber erwartungsgemäß tief modifiziert oder verworfen.

**Track-Wahl** ist Feld eins im Brief; `atl plan` erzeugt daraus unterschiedliche Order-DAGs.

---

## 5. DIE KREATIV-PIPELINE (Agentur-Workflow als Maschine)

```
BRIEF ─► DIRECTION (3 Routen) ─► [VETO: Operator wählt] ─► DESIGN SYSTEM ─► MOTION LANGUAGE
                                                                    │
        GREEN ◄─ POLISH ◄─ [VETO: CRITIC-Report] ◄─ BUILD (AXIOM-Order-DAG) ◄─┘
```

Jede Phase erzeugt ein versioniertes Artefakt (OPERATOR- oder MACHINE-Zone), das nachfolgende Orders als read-only-Vertrag konsumieren. Der Substrat-Mechanismus (Orders, Leases, FIX_PACKETs) bleibt v2 §6–§9.

### 5.1 BRIEF — strukturiertes Discovery-Interview

`atl brief elicit` startet das Elicitation-Protokoll: Der Agent führt das Interview, das Framework liefert den Fragenkatalog (deterministisch, verzweigend) und validiert das Ergebnis gegen das Schema. Der User redet, der Agent füllt `BRIEF.axm.json`:

```json
{
  "$schema": ".../brief.schema.json",
  "track": "bespoke",
  "brand": { "name": "…", "oneLiner": "…", "existingAssets": ["logo.svg"], "voice": ["präzise", "kompromisslos"] },
  "audience": { "who": "…", "device": "desktop-first|mobile-first|balanced", "attention": "explorativ|zielgerichtet" },
  "goal": { "primary": "signup|contact|awareness|portfolio", "successMetric": "…" },
  "references": [
    { "url": "https://activetheory.net", "liked": ["Szenen-Tiefe", "Übergänge"], "disliked": [] },
    { "url": "…", "liked": ["Typo-Mut"], "disliked": ["Ladezeit"] }
  ],
  "mood": { "words": ["monolithisch", "warm", "technisch"], "antiWords": ["verspielt", "startup-bunt"] },
  "content": { "sections": ["hero", "work", "about", "contact"], "assets": "vorhanden|zu-erzeugen|gemischt" },
  "constraints": { "deadlineDays": 14, "mustHave": [], "verboten": ["Stock-Fotos"] },
  "webglAppetite": 0
}
```

**Elicitation-Regeln:** max. 2 Fragen pro Runde; Referenz-URLs sind Pflicht (min. 2 — Geschmack wird gezeigt, nicht beschrieben); `webglAppetite` (0–3) wird immer explizit erfragt inkl. Performance-Kosten-Aufklärung; fehlende Pflichtfelder → `AXM-P001`-Familie, kein Plan ohne vollständigen Brief.

### 5.2 DIRECTION — drei Routen, ein Veto

`atl direct generate` erzeugt einen WORK_ORDER: Der Agent produziert **exakt drei** `DIRECTION.axm.json`-Kandidaten + je ein **Style-Tile** (eine statische Comp-Seite: Typo-Probe, Farbwelt, ein Hero-Ausschnitt, Motion-Beschreibung als Prosa + ein 5-Sekunden-Micro-Demo). Kein Options-Menü-Kompromiss, sondern Agentur-Standard: drei Routen, Creative Director (= Operator) wählt am Veto-Gate. `atl direct choose <id>` friert die Direction ein (Hash ins Manifest — ab jetzt Gesetz, I-20).

```json
{
  "directionId": "dir_B",
  "thesis": "Monolith im Nebel — schwere Serif-Displays, tiefe Dunkelfläche, Licht als einziges Ornament",
  "typography": {
    "display": { "family": "…Variable", "axis": { "wght": [200, 900] }, "case": "mixed" },
    "text": { "family": "…", "size": "fluid" },
    "scaleRatio": 1.333
  },
  "color": { "story": "3 Flächen, 1 Akzent, Akzent nur bei Interaktion", "tokensDraft": { "…": "…" } },
  "space": { "language": "airy", "density": 0.3, "gridBias": "asymmetrisch" },
  "motionPersonality": { "adjectives": ["träge-cinematisch", "gewichtig"], "tempo": "slow", "playfulness": 0.1 },
  "texture": { "grain": 0.15, "noiseShader": true },
  "webglLevel": 2,
  "sceneIdeas": ["Hero: volumetrischer Nebel, Maus als Lichtquelle", "Work-Grid: Displacement-Hover"]
}
```

### 5.3 DESIGN SYSTEM — Tokens v3

`atl tokens build` (Substrat-Mechanik v2, erweitertes Schema): Fluid-Typo (`clamp()`-Generierung aus scaleRatio + Viewport-Range), Rhythmus-Spacing, Farbrollen, **Z-Space** (Tiefenebenen für Parallax/WebGL-Kopplung), Grain/Noise-Parameter. Alles aus der gewählten DIRECTION deterministisch abgeleitet + operator-editierbar.

### 5.4 MOTION LANGUAGE — Bewegung als Tokensystem (Kernstück)

`MOTION.axm.json` — die Grammatik jeder Bewegung im Projekt:

```json
{
  "ease": {
    "hero":  { "curve": [0.16, 1, 0.3, 1],  "meaning": "große Enthüllungen" },
    "snap":  { "curve": [0.83, 0, 0.17, 1], "meaning": "UI-Feedback" },
    "drift": { "curve": [0.25, 0.1, 0.25, 1], "meaning": "Ambient/Parallax" }
  },
  "dur": { "micro": 0.18, "ui": 0.35, "reveal": 0.9, "scene": 1.6, "max": 2.2 },
  "stagger": { "chars": 0.018, "lines": 0.08, "items": 0.12 },
  "scroll": { "lenis": { "lerp": 0.09 }, "scrubDefault": 0.8, "pinSpacing": true },
  "transitions": {
    "pageEnter": { "grammar": "mask-wipe-up", "dur": "scene", "ease": "hero" },
    "pageExit":  { "grammar": "fade-scale-098", "dur": "ui", "ease": "snap" }
  },
  "choreography": {
    "revealOrder": ["display-text", "media", "body-text", "meta"],
    "maxConcurrentTimelines": 3
  },
  "reducedMotion": { "strategy": "opacity-only", "durFactor": 0.5 }
}
```

**Erzwingung — der Unterschied zwischen Motion-Design und Motion-Chaos:**
- `motion-lint` (neue Pipeline-Stage, deterministisch): jeder `gsap.to/from/timeline`-Aufruf im AST muss `ease`/`duration` aus Motion-Tokens beziehen (Import aus `@/generated/motion`). Raw-Strings (`"power2.out"`) oder Raw-Zahlen → `AXM-N001`. 
- Jede Timeline registriert sich über den Core-Wrapper `useChoreo()` — der liefert automatisch: reduced-motion-Variante (I-19), Cleanup, ScrollTrigger-Defaults, Concurrency-Zählung (`AXM-N003` bei > maxConcurrentTimelines).
- `dur.max` ist hart: nichts animiert länger — Selbstverliebtheits-Bremse.

### 5.5 SCENOGRAPHY — WebGL mit Budget

Pro 3D-Szene ein Sidecar `<Scene>.scenography.json`: Szenen-These, Kamera-Choreografie (Keyframes an Scroll-Progress gebunden), Shader-Briefs (Uniforms, gewünschter Look als strukturierte Beschreibung), **Budgets** (maxDrawcalls, maxTextureMB, targetGPUFrameMs), Fallback-Definition (statisches Poster + CSS-Variante für reduced-motion/low-power). PERF-Stage misst gegen diese Budgets (`AXM-G001…`).

---

## 6. PIPELINE v3 — erweiterte Stages

```
GENERATE ─► VALIDATE ─► TYPECHECK ─► LINT ─► MOTION-LINT ─► UNIT ─► E2E/A11Y ─► PERF ─► CRITIC ─► [VETO] ─► GREEN
                                                                                  │RED       │advisory
                                                                             FIX_PACKET   CRITIC_REPORT
```

- **MOTION-LINT:** §5.4, Codes `AXM-Nxxx`. Blockierend.
- **PERF:** Playwright + CDP-Tracing fährt skriptgesteuerte Szenarien (definiert pro Route in `<route>.perf.json`: Scrollfahrt, Hover-Sequenz, Transition). Misst Frame-Times, Long Tasks, LCP/CLS, WebGL-Budgets. Codes `AXM-Gxxx`. Blockierend. FIX_PACKET enthält Trace-Zusammenfassung: schlimmste 3 Frames mit Stack-Attribution — der Agent bekommt gesagt, *welcher* Tween ruckelt.
- **CRITIC:** Die kontrollierte Ausnahme von „kein LLM im Kern". Screenshot-Set (definierte Viewports + Scroll-Positionen + Transition-Standbilder) + DIRECTION + Rubrik → LLM-Review (Modell-Endpoint konfigurierbar, agnostisch) → strukturierter `CRITIC_REPORT.json` (Scores 1–5: Richtungstreue, Hierarchie, Typo-Handwerk, Motion-Kohäsion, Detail-Dichte, Anti-Template; je Finding: Screenshot-Referenz + konkreter Befund). **Advisory, nie autonom blockierend** — der Report ist die Entscheidungsgrundlage des Operator-Veto-Gates. Nichtdeterminismus bleibt damit vor dem Menschen, nicht in der Maschine.
- **Anti-Template-Heuristik (deterministischer Teil des CRITIC-Inputs):** Regelwerk-Checks, die Generik riechen: Systemfont-Nutzung, Default-Tailwind-Palette unverändert, zentrierter Hero+Badge+CTA-Standardaufbau, Inter+Blau+Karten-Raster-Signatur, null Custom-Easings. Findings fließen als Fakten in den CRITIC-Report.

---

## 7. FEHLERCODE-ERWEITERUNG v3

| Prefix | Klasse | Beispiele |
|---|---|---|
| `AXM-Nxxx` | Motion | N001 Raw-Easing/Duration, N002 Timeline ohne useChoreo, N003 Concurrency-Bruch, N004 fehlender reduced-motion-Pfad (I-19) |
| `AXM-Gxxx` | Grafik/Perf | G001 Frame-Budget, G002 Drawcall-Budget, G003 Texturspeicher, G004 LCP/CLS, G005 Shader-Kompilierfehler (normalisiert aus WebGL-Log) |
| `AXM-Rxxx` | Direction/Design-System | R001 Nicht-Token-Farbe/-Typo (verschärftes I-08), R002 Direction-Hash-Drift (I-20), R003 Systemfont erkannt |

FIX_PACKET-Schema unverändert; PERF-Packets tragen zusätzlich `traceSummary`, CRITIC-Reports sind eigenes Artefakt (kein FIX_PACKET, da advisory).

---

## 8. SIGNATURE-PATTERN-LIBRARY (Track A + Rohmaterial für B)

**Pattern-Anatomie (jedes Pattern ein Ordner, MACHINE-registriert):** `pattern.json` (Param-Schema Zod, Perf-Budget, a11y-/reduced-motion-Fallback-Spec, Abhängigkeiten), Komponente(n), Shader-Dateien, Motion-Spec (nur Token-Referenzen — Pattern bringt Choreografie mit, nie eigene Easings), Fixture-Seite, Golden-Screenshots (für Visual Gate v2 §14.3).

**Initialer Katalog (v3-Umfang, 18 Patterns — Diktat, erweiterbar via Order):**

| Kategorie | Patterns |
|---|---|
| **WebGL-Szenen** | `distortion-media` (Displacement/RGB-Shift-Hover), `flowmap-hero` (Fluid-Trail unter Cursor), `particle-type` (Text aus Partikeln, Zerfall/Reform), `mesh-gradient-bg` (animierter Gradient-Shader), `dither-shader` (Retro-Dither/ASCII-Modus), `depth-gallery` (Z-Space-Kamerafahrt durch Media) |
| **Scroll-Choreografie** | `pinned-narrative` (Abschnitt pinnt, Inhalt wechselt scrubbed), `horizontal-drift` (horizontale Sektion in vertikalem Fluss), `parallax-stack` (Z-Space-Token-gebundene Ebenen), `sequence-scrub` (Bildsequenz an Scroll) |
| **Typo-Motion** | `split-reveal` (SplitText Lines/Chars, maskiert), `weight-breathe` (Variable-Font-Achsen-Animation), `marquee-velocity` (scrollgeschwindigkeitsreaktive Laufschrift) |
| **Navigation/Übergang** | `page-mask-transition` (Curtain/Mask-Grammatiken), `webgl-crossfade` (Szenen-Übergang als Shader), `magnetic-cta`, `cursor-system` (Custom-Cursor, Blend-Modes, Kontext-Morphing), `preloader-counter` (Zähler + Asset-Warmup + Enthüllungs-Choreografie) |

Jedes Pattern: `atl pattern add <name> --params <json>` → Instanziierung mit Projekt-Tokens, Registrierung im Manifest, Sidecar generiert, sofort pipeline-fähig.

---

## 9. ASSET-PIPELINE

- **Fonts:** `atl assets font add <file>` → Subsetting, woff2, Preload-Tags, `@font-face` mit `font-display: block` + Fallback-Metrik-Matching (size-adjust) gegen CLS. Systemfont im Build → `AXM-R003`.
- **Bilder:** Build-Zeit sharp: AVIF/WebP-Derivate, exakte `sizes`, dominante Farbe + Blur-Placeholder, EXIF-Strip. Raw-`<img>` ohne Pipeline → Lint-Fehler.
- **3D/Texturen:** glTF-Validierung + Draco/Meshopt-Kompression beim Import (`atl assets model add`), KTX2-Texturen; unkomprimiertes Asset > Budget → `AXM-G003` bereits beim Import, nicht erst zur Laufzeit.
- **Video:** v3 nur als Asset (komprimiert, poster, lazy) — **Generierung** ist v4 (§13).

---

## 10. INVARIANTEN-AMENDMENTS (gegenüber v2 §2)

| ID | Änderung |
|---|---|
| **I-01/I-02 (Caps)** | Bestehen für TS/TSX. **Ausnahmen:** `.glsl` bis 300 LOC; Pattern-Kompositionsdateien bis 180 LOC (Choreografie braucht Raum). Ausnahmen sind pfadklassen-gebunden, nicht verhandelbar pro Datei. |
| **I-08 (tokens-only)** | Verschärft zu **R-Klasse:** Farben, Typo, Spacing, Easings, Durations, Z-Ebenen — alles Token. **Gelockert für:** Shader-interne Konstanten und sanktionierte `composition.css`-Dateien (eine pro Route, keyframes/clip-paths erlaubt, Farben/Zeiten weiterhin nur via CSS-Custom-Property-Tokens). |
| **I-13 (data-axm-id)** | Unverändert + Pflicht auf Pattern-Wurzeln. |
| **I-18 (neu)** | Kein GSAP/Three-Import außerhalb von `useChoreo`/`<Stage>`-Core-Wrappern — die Wrapper sind die Mess- und Enforcementpunkte. |
| **I-19 (neu)** | Jede registrierte Animation deklariert reduced-motion-Verhalten (eigene Variante oder Strategie-Opt-in aus MOTION.reducedMotion). Fehlt beides → `AXM-N004`. |
| **I-20 (neu)** | DIRECTION/MOTION/SCENOGRAPHY sind nach Freeze hash-versiegelt. Agent-seitige Änderung → `AXM-R002`; Änderungswunsch läuft als Eskalation an den Operator (`atl direct amend` mit Begründung). |

---

## 11. CLI-ERGÄNZUNGEN (`atl` ⊃ `axm`)

- `atl brief elicit | validate`
- `atl direct generate | choose <id> | amend --reason <text>`
- `atl motion build` (MOTION.json → `src/generated/motion.ts` + CSS-Custom-Properties)
- `atl scene add <Name> --scenography <path>`
- `atl pattern list | add <name> --params <json> | eject <name>` (eject: Pattern wird AGENT-Zone-Kopie für Bespoke-Modifikation, verliert Golden-Screenshot-Bindung)
- `atl assets font|image|model add <path>`
- `atl perf trace --route <path>` (lokaler PERF-Lauf mit Trace-Report)
- `atl critic run [--route <path>]`
- `atl plan` (überschreibt `axm plan`: Track-abhängige Dekomposition — Bespoke-DAG: Direction-Orders vor allen Build-Orders; Curated-DAG: Preset → Pattern-Kompositions-Orders)

Exit-Codes, NDJSON, Idempotenz: Substrat-Regeln v2 §5.

---

## 12. TOKEN-ÖKONOMIE-ERGÄNZUNG

Slices für Build-Orders enthalten zusätzlich (voll): gewählte DIRECTION, MOTION.json, betroffene SCENOGRAPHY, Pattern-`pattern.json` der genutzten Patterns. Diese Artefakte sind klein (je < 2 KB by design — deshalb sind es Schemas und keine Prosa-Moodboards) und ersetzen tausende Tokens an „mach es schön"-Prompt-Poesie. Der Slice-Cache/sig-index (v2 §11) bleibt.

---

## 13. EXPLIZITE NICHT-ZIELE (v3)

- **Keine Video-/Bild-KI-Generierung** — v4-Horizont; v3 behandelt gelieferte Assets erstklassig, erzeugt keine.
- **Kein CMS** — Content lebt in strukturierten Content-Dateien (MD/JSON pro Sektion); CMS-Adapter = v4.
- **Kein E-Commerce, kein Auth** — Landingpage/Portfolio/Kampagnen-Scope.
- **Keine generative Direction ohne Referenzen** — min. 2 Referenz-URLs sind Pflicht; Geschmack aus dem Nichts ist Halluzination mit Stil.
- **Kein Award-Versprechen** — das Framework garantiert das Handwerk der 10.000-€-Klasse; den letzten Funken jurieren Menschen.

---

## 14. BAUPLAN v3 (re-priorisiert)

**Substrat-Voraussetzung:** AXIOM M0–M6 vollständig; aus v2 zusätzlich M8 (Plan/Orders), M9 (Multi-Agent) und M10 (Ledger/Slicing) — **M7 (API/DB) wird auf ein Formular-Modul reduziert und ans Ende geschoben; M12-Bench wird durch A8 ersetzt.**

| MS | Deliverable | Abnahmekriterium (hart) |
|---|---|---|
| **A0** | Stack-Integration: Next 15 + R3F + GSAP + Lenis + Shader-Loader im Scaffold; `useChoreo`/`<Stage>`-Core-Wrapper | Fixture-Seite mit Scroll-Pin + WebGL-Quad läuft; I-18-Verstoß-Fixture → korrekter Lint-Fehler |
| **A1** | Tokens v3 + Motion-System: Schemas, `atl motion build`, Fluid-Typo-Generator | Golden-File: MOTION.json → byte-identisches motion.ts; N001/N004-Fixtures liefern korrekte Codes |
| **A2** | Brief + Direction-Workflow: Elicitation-Katalog, Schemas, Style-Tile-Order-Template, Freeze/Amend (I-20) | Interview-Simulation füllt validen Brief; Direction-Freeze → R002 bei Agent-Mutation |
| **A3** | Motion-Lint + A11y-Gate komplett | AST-Fixtures: 12 Verstoßarten → 12 korrekte Packets; reduced-motion-E2E prüft Opacity-only-Pfad |
| **A4** | PERF-Stage: CDP-Tracing, Szenario-Runner, Budget-Auswertung, Trace-Attribution im FIX_PACKET | Präparierter Jank-Fixture (Layout-Thrashing-Tween) → G001-Packet benennt den schuldigen Tween |
| **A5** | Pattern-Library Welle 1 (9 Patterns: je 3 pro Kategorie WebGL/Scroll/Typo) inkl. Golden-Screenshots | Jedes Pattern: Instanziierung in 2 verschiedenen Direction-Presets → sichtbar verschiedene, jeweils GREEN Fixtures |
| **A6** | Pattern-Library Welle 2 (restliche 9) + `eject`-Mechanik + Asset-Pipeline | glTF-Überbudget-Fixture → G003 beim Import; eject → Pattern in AGENT-Zone, Pipeline weiter GREEN |
| **A7** | CRITIC-Stage + Anti-Template-Heuristik + MCP-Server | CLI≡MCP-Golden-Test; CRITIC-Report schema-valide auf 3 Fixture-Sites; Heuristik erkennt präparierte Generik-Site |
| **A8** | Gesamt-Abnahme: zwei Referenzprojekte (Track A Kampagnen-Page, Track B Portfolio bespoke) end-to-end durch 2+ verschiedene Agenten-CLIs (z. B. Claude Code UND ein zweites Ökosystem) | Szenario S-20 grün auf beiden Agenten; Formular-Modul nachgezogen |

### Abnahmeszenarien (Gherkin, Auswahl)

```gherkin
Szenario S-13: Motion-Gesetz
  Angenommen ein Agent schreibt gsap.to(el, { duration: 0.7, ease: "power2.out" })
  Wenn die Pipeline läuft
  Dann schlägt MOTION-LINT mit AXM-N001 fehl
  Und der fixHint verweist auf die Token-Importe aus @/generated/motion

Szenario S-14: Direction ist Gesetz
  Angenommen dir_B ist gefroren und ein Agent ändert die Display-Fontfamilie
  Wenn "atl validate" läuft
  Dann AXM-R002 mit Direction-Hash-Referenz
  Und die agentInstruction verlangt "atl direct amend" statt stiller Änderung

Szenario S-15: Ruckeln hat einen Namen
  Angenommen eine Route verfehlt das Frame-Budget während der Scrollfahrt
  Wenn die PERF-Stage endet
  Dann enthält das FIX_PACKET die 3 schlechtesten Frames mit Attribution auf Datei+Tween
  Und nach Korrektur NUR dieser Stelle wird die Stage GREEN

Szenario S-16: Ein Pattern, zwei Gesichter
  Angenommen "distortion-media" wird in Preset "Monolith" und Preset "Neon-Playful" instanziiert
  Wenn beide Fixtures gerendert werden
  Dann unterscheiden sich Typografie, Farbwelt und Easing-Verhalten nachweisbar (Screenshot-Diff > 30 %)
  Und beide bestehen PERF und A11Y

Szenario S-17: Immersion ohne Ausschluss
  Angenommen prefers-reduced-motion ist aktiv
  Wenn die E2E-Suite die Hero-Szene lädt
  Dann rendert der definierte Fallback (Poster + Opacity-Reveals)
  Und keine Timeline mit Transform-Animationen ist registriert

Szenario S-20: Agentur-Emulation end-to-end (Gesamt-Abnahme)
  Angenommen ein frisches Repo, ein realer Brief mit 2 Referenz-URLs und webglAppetite=2
  Wenn ein beliebiger CLI-Agent den Workflow fährt (brief → 3 Directions → Operator-Wahl → Build)
  Dann liefert "atl deploy --env preview" eine URL
  Und alle deterministischen Gates sind GREEN
  Und der CRITIC-Report scort ≥ 4/5 auf Richtungstreue und Anti-Template
  Und derselbe Workflow funktioniert mit einem zweiten, anderen Agenten-CLI ohne Spec-Änderung
```

---

## 15. KONFIDENZ- UND LÜCKENREPORT v3

**Gesamtkonfidenz: 79 %** — niedriger als v2, und das ist korrekt so: v3 verspricht Geschmack, und Geschmack ist das feindseligste Terrain für Determinismus. Die Architektur zieht die ehrliche Grenze (Maschine = Handwerk, Mensch = Magie), aber die Grenze selbst ist das Risiko.

| Bereich | Konfidenz | Kommentar |
|---|---|---|
| Stack-Integration (Next/R3F/GSAP/Lenis) | 92 % | Etablierte Kombination der gesamten Szene |
| Motion-Tokensystem + Lint | 88 % | AST-Erkennung von GSAP-Calls ist solide; Edge-Case: dynamisch komponierte Timelines (per Regelwerk auf useChoreo-Pflicht reduzierbar) |
| PERF-Stage mit Trace-Attribution | 80 % | CDP-Tracing ist verlässlich; die Attribution „welcher Tween" braucht Source-Map-Fleiß — fummeligster Deterministik-Baustein |
| Pattern-Parametrik (ein Pattern, n Gesichter) | 82 % | Token-Injektion trägt weit; Restrisiko: Patterns, deren Charakter an einer Direction klebt — Kuratierung in A5/A6 muss hart aussortieren |
| Direction-Workflow-Qualität | 72 % | Ob 3 agentengenerierte Routen Agentur-Niveau erreichen, hängt am Modell hinter dem CLI — das Framework strukturiert und erzwingt Referenzen, zaubern kann es nicht |
| CRITIC-Aussagekraft | 68 % | LLM-Design-Kritik gegen Rubrik ist vielversprechend, aber unkalibriert; A7 braucht einen Kalibrierungssatz (10 Sites mit bekanntem Qualitätsurteil) |
| „Active-Theory-Niveau" erreichbar | 60 % | Ehrlich: Top-1%-Award-Sites enthalten Monate handgeschriebener Shader. Realistisches v3-Ziel ist das solide obere Agentur-Mittelfeld (die vierstellige Klasse) — reproduzierbar, in Tagen statt Monaten. Die Fünfstelligen bleiben Track B + viel Operator-Iteration. |

**Lücken (P-Tier):**
- **P1 — CRITIC-Kalibrierung:** Rubrik + Referenz-Screenshot-Set + erwartete Scores als Fixture definieren, bevor A7 beginnt — sonst misst das Gate Rauschen.
- **P1 — Tween-Attribution im PERF-Packet:** Source-Map-Pfad von CDP-Trace zu useChoreo-Registrierung spezifizieren (Vorschlag: jede Choreo registriert eine ID, die als Timeline-Label + Performance-Mark läuft) — vor A4 festzurren.
- **P2 — Style-Tile-Format:** Statische Comp vs. Micro-Interaktiv (5-s-Demo) — Empfehlung: beides, Demo nur für die Motion-Sektion; Aufwandsentscheidung vor A2.
- **P2 — Preset-Katalog Track A:** Anzahl und Charakter der kuratierten Direction-Presets (Vorschlag: 6 — je 2 pro Tempo-Klasse slow/mid/fast) — Operator-Geschmackssache, vor A5.
- **P3 — v4-Horizont:** Video-/Asset-Generierung als Brief-gesteuertes Modul, CMS-Adapter, WebGPU-Default — Schnittstellen sind vorbereitet (Asset-Pipeline, Brief-Schema `assets: "zu-erzeugen"` existiert bereits als Enum-Wert).

**Offene Operator-Entscheidungen: zwei** — Style-Tile-Format (P2) und Preset-Anzahl (P2). Beides Geschmack, beides kein Blocker vor A2/A5. Der Rest ist diktiert.
