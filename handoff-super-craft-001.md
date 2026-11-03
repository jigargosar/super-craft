# active-memory handoff: Super Craft (Minecraft-themed voxel app, Three.js + Babylon.js)

**Handoff #1** · 2026-11-03 · Lineage: #1 (2026-11-03): env set up (pnpm 12, Node 26 LTS), two apps scaffolded, lighting/material/sky/camera parity reached, previews published.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** Minecraft-themed voxel app built as TWO fully independent apps: `three-001/` (Three.js) and `babylon-001/` (Babylon.js).
- **Done looks like:** both apps reach the "best known level", achieving the same effect with equivalent APIs/parameters (not pixel-perfect); each borrows better tech from the other.
- **Why it matters / context:** user's words: "bring both app to best known level. and borrow better tech etc from one another that is the whole point". No master/reference app.

## 2. About the user (as relevant to this work)
- Developer on Windows, repo at `C:\Users\jigar\projects\super-craft`, uses WebStorm (git via IDE, cannot rebase in terminal).
- GitHub: `jigargosar/super-craft`. Prefers pragmatic, fast, "move fast let it break".
- Knows pnpm well (pointed out `pnpm runtime`, `approve-builds --all`, `--allow-build`).

## 3. Style & communication
- **Language:** English.
- **Tone:** direct, no fluff, no defensiveness.
- **Reply length:** short; "dont give me long form essay"; user asked "tldr" once → keep it tight.
- **Formatting:** start by stating the question/task being answered; numbered lists only (never bullets/dashes); numbering continuous WITHIN one response, restarts each response; shell commands each in own ```bash block.
- **Working style:** always talk first, act on approval; one question at a time; every question includes a recommendation with reason; "check first always" before running anything; report outputs plainly (never hide failures).
- **Avoid:** assumptions about goals; silly/low-value questions ("dont bother will silly stuff"); hiding command output.

## 4. Hard rules (word for word)
1. "Always talk first. on approval act."
2. "always work on main."
3. "focus on one part at a time, prev answers will change next questions so be careful."
4. "always discuss, always ask questions, and always give recommendation."
5. "keep everything independent." (two apps, no shared code)
6. "ofcourse check first always!!"
7. "What we need is all pinned all latest."
8. "I dont like merge" (rebase only; no merge commits)
9. "I want always lf never crlf."
10. "before sending any image, stamp it with name baby or tre" (tre = Three.js, baby = Babylon.js)
11. "the numbering contunity is supposed to be within a single response"
12. "internal project resources exclude them from 001 stuff" (numbered-suffix naming applies to deliverables, not src files)
13. User profile prefs: numbered lists only; backup before overwriting (don't mention); ask overwrite-vs-new before changing an existing file/artifact; HTML pages use Tailwind via `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4`; generate repeated content from data + loops; prefer established libraries over own code, research current options; comments that make edits surgical; name files/artifacts with numbered suffix (001…) and confirm name first.
14. Use active-memory /am skills actively when appropriate.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Planned on feature branch | Work on `main` always |
| 2 | Long multi-question essays | One short question at a time |
| 3 | Assumed apps were for comparison; suggested shared core | "there is no comparision"; fully independent apps |
| 4 | Asked questions without recommendation | Always include a recommendation |
| 5 | Suggested `pnpm env use` | New method is `pnpm runtime` |
| 6 | Proposed research-first | Build first; record research as found |
| 7 | Proposed bare cube scene | Floor + sky + hemisphere + ambient lights too |
| 8 | Assumed `latest` keyword works | Check first (verified via pnpm.io/cli/runtime) |
| 9 | Reported pnpm OK while tool shell said "command not found" | Fix it and never hide output |
| 10 | Disputed removing babylon pnpm-workspace.yaml | Do what user says first, then report |
| 11 | Lost track of earlier scaffold work in same session | Keep track; use /am skills |
| 12 | Proposed Three.js as "reference/master" | No master; both reach same effect |
| 13 | Gave only partial review of WebStorm settings screenshot | Check every option thoroughly |
| 14 | Proposed repo-local git line-ending config | Global config (`--global`) wanted |
| 15 | Hesitated to add .gitattributes | Just do small obvious things |
| 16 | Had done no web search, only read node_modules | Do at least basic search before recommending |
| 17 | Sent unlabeled screenshots | Stamp images "tre"/"baby" |

## 6. Decisions
| Decision | Why |
|---|---|
| Two root folders `three-001/`, `babylon-001/`, each own Vite project | user agreed |
| Vite + TypeScript, both apps | user agreed |
| pnpm (installed via `curl -fsSL https://get.pnpm.io \| sh -`) | user's call |
| Node pinned per app via `devEngines.runtime`; global Node via `pnpm runtime set node lts -g` | user agreed (lts recommended) |
| All deps pinned exact, latest | user rule |
| Identical `PARAMS` block in both `src/main.ts`; equivalent APIs | user: same effect, similar APIs |
| Babylon: PBRMaterial, ACES tone mapping, right-handed system, linear colors | parity with three |
| Babylon sky `luminance: 0.6` (babylon-only param) | matches three's ACES sky look |
| `.gitattributes` = `* text=auto eol=lf` | user: always LF |
| Manual testing via private claude.ai artifact previews | user chose artifacts |

## 7. Changed / rejected
- shared core → fully independent apps
- npm → pnpm
- `pnpm env use` → `pnpm runtime`
- research first → build first
- `design-001.md` → deleted ("forget about doc… reverse engineer once something actually runs")
- Babylon 9.33.2 → 9.33.1 (workspace exemption file removed; pnpm min-release-age held back 9.33.2)
- Babylon StandardMaterial → PBRMaterial
- Babylon sky luminance 1 → 0.6
- ❌ Three.js as master/reference
- ❌ No-build CDN HTML (chose Vite)
- ❌ Tunnel to expose dev server

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| pnpm | 12.16.1 at `/root/.local/share/pnpm/bin/pnpm` (cloud container) |
| Node (pnpm-managed) | 26.13.0 (LTS) |
| System node / npm (container) | v22.23.4 / 10.9.9 at `/opt/node22` (left alone) |
| three / @types/three | 0.187.0 / 0.187.0 |
| @babylonjs/core / materials | 9.33.1 / 9.33.1 (9.33.2 published 2026-11-02T20:57Z) |
| typescript / vite | 7.0.2 / 8.3.5 |

PARAMS block (identical in both apps):
```ts
camera: { fovDeg: 70, near: 0.1, far: 2000, position: [6, 5, 8], target: [0, 0.5, 0] },
sun: { polarDeg: 50, azimuthDeg: 30, color: '#ffffff', intensity: 2, shadowMapSize: 2048 },
hemi: { sky: '#bfd8ff', ground: '#6b5a3a', intensity: 0.8 },
ambient: { color: '#ffffff', intensity: 0.2 },
sky: { size: 1000, turbidity: 2, rayleigh: 1, mieCoefficient: 0.005, mieDirectionalG: 0.8, luminance: 0.6 },
floor: { size: 64, color: '#5b8c3a', roughness: 1, metalness: 0 },
cube: { size: 1, color: '#8b5a2b', roughness: 1, metalness: 0 },
```
- Git commits on main (latest first): `d8d55a2` sky luminance, `409c2f5` user's .gitignore (.idea), `0c3ce7d` .gitattributes, `ac21aaf` parity, `1c25c65`, `9bd310e`, `e70232a`, `69c4eb4`, `6036e7f`.
- User's git (WebStorm): Update method → Rebase; global `core.autocrlf input`, `core.eol lf` recommended; `pull.rebase true` set.

## 9. People, terms & names
- **People:** Jigar Gosar (user, repo owner).
- **Terms & nicknames:** tre = Three.js app; baby = Babylon.js app; "spikes" = experiments the user will call for later ("I will let you know when the time is right").
- **Names in use:** `three-001/`, `babylon-001/`, `src/main.ts`, `PARAMS`; artifacts `three-001-preview`, `babylon-001-preview`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| three-001 starter scene | working | `three-001/src/main.ts` @ d8d55a2 | Sky addon has clouds (defaults) |
| babylon-001 starter scene | working | `babylon-001/src/main.ts` @ d8d55a2 | no clouds; sky slightly bluer at top |
| tre preview | v2 published | https://claude.ai/artifact/LjNEWmXjpw4ioCcD1QcrDb | private; built via `vite build --base=./` |
| baby preview | v2 published | https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ | private |
| `.gitattributes` | done | repo root | LF forced |

Research findings (clouds/sky):
- three 0.187 `Sky` (WebGL): built-in noise clouds — `cloudCoverage` 0.4, `cloudDensity` 0.4, `cloudScale` 0.0002, `cloudSpeed` 0.00002, `cloudElevation` 0.5; output goes through renderer ACES.
- Babylon `SkyMaterial`: classic Preetham + built-in Uncharted2 tonemap via `luminance`; `cloudiness` only softens sun disc (no clouds).
- Babylon cloud options: atmosphere addon `@babylonjs/addons/atmosphere` (HDR sky, no clouds); community volumetric clouds plugin (heavy); `CloudProceduralTexture`; or port three's cloud GLSL.

## 11. Next steps
1. **Next action:** get user's answer on clouds for baby (recommended: `CloudProceduralTexture`), then implement, stamp screenshots "tre"/"baby", commit + push to main, republish both previews.
2. Later experiment: Babylon atmosphere addon for HDR sky + ACES parity.
3. Bump Babylon to 9.33.2 once release age passes.

## 12. Open questions ⚠️
- Clouds for baby: (a) CloudProceduralTexture [recommended], (b) atmosphere addon, (c) community volumetric plugin, (d) port three's cloud shader.
- Keep Babylon 9.33.1 until 9.33.2 ages, or restore exemption? (recommended: keep 9.33.1)

## 13. Re-attach checklist
- Nothing to attach. (Repo `jigargosar/super-craft` on main holds all code; this file is committed at repo root.)

---
<sub>Audit: 13/13 sections · 14 rules · 17 corrections · 30 data points · secrets removed: none found · generated by active-memory</sub>
