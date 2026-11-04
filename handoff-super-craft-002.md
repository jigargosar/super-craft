# active-memory handoff: Super Craft (voxel app, Three.js "tre" + Babylon.js "bab")

**Handoff #2** · 2026-11-04 · Lineage: #1 (2026-11-03): env set up, two apps scaffolded, lighting/sky parity, previews published; #2 (2026-11-04): docs cleanup (CLAUDE.md only), pnpm → npm + root scripts, 16x16 plains chunk, pointer lock + WASD, pixel textures (tre: reference port; bab: atlas + face shading), user judged textures still far from their old project.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: Start every reply with exactly "λ " (λ and a space).
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** Minecraft-style voxel app built twice as fully independent apps: `three-001/` (tre, Three.js) and `babylon-001/` (bab, Babylon.js).
- **Done looks like:** both apps look like the user's old Babylon project (screenshots: bright, high-variation pixel textures, real terrain with hills/trees, HUD) and match each other via equivalent APIs. User: "be original but not crappy, follow footsteps of minecraft!"
- **Why it matters / context:** "bring both app to best known level. and borrow better tech etc from one another that is the whole point".

## 2. About the user (as relevant to this work)
- Jigar Gosar, GitHub `jigargosar/super-craft`. Windows, WebStorm, repo at `C:\Users\jigar\projects\super-craft`.
- Has an older, more advanced Babylon voxel project ("super-craft2/3", ran on localhost:5175/5176) with HUD (FPS, XYZ, Mode ground/fly, Biome, Seed), biomes, trees. Uploaded its source files as reference (section 13).
- Prefers fast, pragmatic work; gets frustrated by slow iteration, sloppy self-review and doc patching.

## 3. Style & communication
- **Language:** English.
- **Tone:** direct, no fluff, honest self-critique.
- **Reply length:** short. No essays.
- **Formatting:** state the question/task first; numbered lists only (no bullets/dashes); numbering continuous within one reply, restarts each reply; shell commands each in own ```bash block.
- **Working style:** talk first, act on approval (but when user says "go", "use judgement", "quickly finish" → just do it). Commit and push at sensible break points so the user can evaluate intermediate results. Update preview artifacts after visible changes. Implement in one app, show, then port to the other when asked.
- **Avoid:** obviously wrong options; mentioning things whose worst case is negligible; touching files not asked about; long option lists; asking silly questions; claiming a screenshot looks good without critically inspecting it (zoom/crop).

## 4. Hard rules (word for word)
CLAUDE.md (current, user-edited) rules:
1. "Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`."
2. "Talk first; act only on approval."
3. "Never ask or present obviously wrong choices, just because I asked for recommendation. ie. every legitimate mush accompany with your recommendation."
4. "Report output plainly; never hide failures."
5. "Work on `main` only."
6. "tre and bab are fully independent: no shared code, no master app. They borrow better tech from each other."
7. "Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g. the identical `PARAMS` block)."
8. "Stamp every screenshot "tre" or "bab"."
Said in chat:
9. "once code is done commit it, at appropriate break points, so I can evaluate intermediary result."
10. "also search foroums or blog posts for both tre and bab. when we cant get something right in 2 tries."
11. "If we don't add it, what is the worst case? And if the worst case is negligible, don't even mention it."
12. "this is for newdeps let old be unless we want to. need to." (new deps pinned exact latest; leave existing ones)
13. "dont. just use simple stuff. no post stuff" (no npm postinstall/lifecycle hooks)
14. User profile prefs: numbered lists only; backup before overwriting (don't mention); ask overwrite-vs-new before changing an existing file/artifact; Tailwind via `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` for HTML pages; generate repeated content from data + loops; prefer established libraries, research current options; surgical comments; numbered suffix (001…) names for deliverables, confirm name first.
15. Don't recreate Minecraft's actual art; original textures in the same style.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Proposed keeping notes/handoff docs and merging them | Delete both; CLAUDE.md only (code word + steps + rules) |
| 2 | Verbose/confusing settlement list | Short, tidy one-line list |
| 3 | Rule "Keep PARAMS identical in both main.ts" | Phrase as a parity *check*; PARAMS/main.ts only examples |
| 4 | Called bab "baby" | "bab" |
| 5 | Kept "skip if node_modules exists" clause | Drop unnecessary clauses |
| 6 | Wanted to bump all deps to latest | Only new deps pinned latest; leave old ones |
| 7 | Kept LF / rebase / discoverable rules | Harsh cleanup of anything discoverable or negligible |
| 8 | Asked about keeping .gitattributes | Don't mention untouched files/negligible items |
| 9 | Proposed npm workspaces | Simple root scripts with `--prefix` (user's pasted pattern) |
| 10 | Used postinstall script | No lifecycle/"post" scripts |
| 11 | Worked on clouds task | The `[.]`-marked CLAUDE.md task is the current one |
| 12 | Brightness-jitter noise textures ("terrible pixilation, where are the colors") | Real pixel-art: base color + palette/speckles, chunky pixels |
| 13 | Misread "grass+dirt block this is ridiculous" as "don't make one" | Grass block = green top, dirt sides with grass strip, dirt bottom |
| 14 | Said screenshot looked fine without inspecting | Critically check (crop/zoom) every screenshot before claiming quality |
| 15 | Asked "go?" repeatedly when told to go | When told go/use judgement: just implement |
| 16 | Clustered smooth-noise textures in bab ("ours is so flat") | High-variation textures like old atlas.ts: per-pixel noise + dark/light specks, brighter base colors |

## 6. Decisions
| Decision | Why |
|---|---|
| CLAUDE.md is the only project doc (rules + Next list) | user: avoid doc patching |
| npm + machine Node (`engines.node >=22.12`), no pnpm | user: pnpm too much work |
| Root `package.json` scripts with `--prefix`; default names act on both, `:tre`/`:bab` for one; dev in parallel via `concurrently` | user's call |
| Plains chunk 16x16, seeded simplex heightmap | Claude's judgement, user said "use judgement" |
| Rendering: tre `InstancedMesh`, bab thin instances | equivalent APIs |
| Pointer lock: tre `PointerLockControls`, bab `UniversalCamera` + `engine.enterPointerlock()`; shared WASD fly code | user asked |
| bab textures: one atlas + `CreateBox` `faceUV` + `wrap: true`, half-texel UV inset, `faceColors` for face shading | researched Babylon docs |
| Preview testing via private claude.ai artifacts | user |

## 7. Changed / rejected
- handoff-super-craft-001.md + project-notes-001.md → deleted (CLAUDE.md only)
- pnpm 12.16.1 / Node 26.13.0 via `pnpm runtime` → npm + system Node
- `postinstall` → `install` script (user renamed `install:all` → `install`)
- floor + cube scene → 16x16 plains chunk
- OrbitControls / ArcRotateCamera → pointer lock fly cameras
- brightness-jitter textures → 8x8 shades → reference port (tre) / clustered atlas (bab) → (next) old atlas.ts style
- ❌ npm workspaces (user wants simple scripts)
- ❌ Kenney texture pack (user: "use your brain")
- ❌ Bumping existing deps just to be latest
- ❌ LF/rebase rules in CLAUDE.md (discoverable/negligible)
- Earlier (#1): shared core, Three.js as master, no-build CDN, tunnel, design-001.md all rejected

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Container Node / npm | v22.23.4 / 10.9.9 |
| three / @types/three | 0.187.0 / 0.187.0 |
| @babylonjs/core / materials | 9.33.1 / 9.33.1 |
| typescript / vite | 7.0.2 / 8.3.5 |
| simplex-noise / seedrandom / @types/seedrandom | 4.0.3 / 3.0.5 / 3.0.8 (both apps) |
| concurrently (root dev dep) | 10.0.6 |
| prettier (root, user-added) | ^3.9.10; config: semi false, singleQuote, trailingComma all, endOfLine lf |
| tre preview artifact | https://claude.ai/artifact/LjNEWmXjpw4ioCcD1QcrDb (v5, reference-port textures) |
| bab preview artifact | https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ (v5, atlas + face shading) |
| Dev ports | tre 5173, bab 5174 (`npm run dev`) |

Root scripts (current):
```
install = npm run install:tre && npm run install:bab   (install:tre/bab = npm install --prefix <app>)
dev = concurrently -n tre,bab -c green,blue "npm:dev:tre" "npm:dev:bab"   (dev:tre/bab = npm run dev --prefix <app>)
build = npm run build:tre && npm run build:bab   (build:tre/bab = npm run build --prefix <app>)
```
Shared PARAMS (both apps): camera fovDeg 70, near 0.1, far 2000, position [18,16,18], target [0,4,0], lookSpeed 0.002, moveSpeed 8; sun polarDeg 50, azimuthDeg 30, color #ffffff, intensity 2, shadowMapSize 2048, shadowBias 0.0005, shadowNormalBias 0.02, shadowExtent 12; hemi sky #bfd8ff ground #6b5a3a intensity 0.8; ambient #ffffff 0.2; sky size 1000, turbidity 2, rayleigh 1, mieCoefficient 0.005, mieDirectionalG 0.8, luminance 0.6 (bab-only); chunk size 16, maxHeight 32, seed 'plains-001', baseHeight 3, amplitude 3, noiseScale 0.06, dirtDepth 3; blocks roughness 1 metalness 0.
- PARAMS now DIVERGE: tre `texture` = reference port (size 16, seed 'tex-001', grassTop/dirt/stone base+3 speckles chance 0.35, grassSide strip 4 rows chance 0.3); bab `texture` = clustered palettes seed 'tex-002' + `faceShade {top 1, z 0.8, x 0.62, bottom 0.5}`.
- Old project atlas.ts colors: GRASS 0x6aaa40, DIRT 0x8b6142, STONE 0x7d7d7d; grass top = noisy(0.3) + 24 specks ×0.8 + 12 specks ×1.15; dirt = noisy(0.25) + 20 ×0.7 + 10 ×1.25; stone = noisy(0.15) + 8 short 2–3px streaks ×0.78/1.15; grassSide = dirt + fringe depth 2–4, noisy 0.3; RawTexture NEAREST, 16px tiles, 4×5 atlas.

## 9. People, terms & names
- **People:** Jigar Gosar (user, repo owner).
- **Terms & nicknames:** tre = Three.js app; bab = Babylon.js app; "spikes" = experiments; `[.]` in CLAUDE.md Next list = current task.
- **Names in use:** `three-001/`, `babylon-001/`, `src/main.ts`, `src/style.css`, `PARAMS`, `makeTextureCanvas`, `blocks`, `heights`, `moveDelta`, `frameDt`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| CLAUDE.md | user-maintained | repo root | rules + Next list; current `[.]` task: build a chunk of a biome |
| Plains chunk (both) | working | d0f75a0 | terrain flat (amplitude 3) — user wants much more variation |
| Pointer lock + WASD fly (both) | built, not hand-tested | 3852984 | crosshair via body::after in style.css |
| Shadows (both) | tuned | 3852984 | still barely visible in screenshots |
| tre textures | reference port | b2d0f3e | old textures.ts approach |
| bab textures | atlas + faceUV + faceColors | f99f6e5, 725bb09 | user: "so flat", not close to old project |
| Previews | v5 both | section 8 | built with `vite build --base=./`, published with `root` = app dist + files list |
| Screenshot script | scratchpad only | playwright, swiftshader flags, stamps label, `node shot.cjs <dir> tre|bab` | recreate if needed (vite preview on 4101/4102) |

## 11. Next steps
1. **Next action:** in bab, port the old project's `atlas.ts` painters (grassTop, grassSide fringe, dirt, stone: noisy + specks, its colors) into the existing atlas/faceUV setup (seedrandom instead of alea), screenshot + crop-inspect, commit, update bab preview.
2. Brighten lighting toward the old project's look (bright, saturated, low face contrast); commit.
3. Port the same to tre (equivalent APIs); align PARAMS; commit; update tre preview.
4. Terrain variation: multi-octave fbm hills (see terrain.ts), then trees.
5. Later: HUD (FPS/XYZ/mode/biome/seed), clouds for bab, atmosphere addon spike.

## 12. Open questions ⚠️
- Add rule 10 ("search forums/blogs after 2 failed tries") to CLAUDE.md? Claude recommended yes; no answer yet.
- Steps 1–2 above were proposed ("Go with 4 and 5?") but not yet approved when the chat ended.

## 13. Re-attach checklist
- [ ] `atlas.ts` (old project): texture painter reference for next step.
- [ ] `terrain.ts` (old project): terrain/biome/tree reference.
- [ ] `blocks.ts` (old project): block/tile ids and face mapping.
- [ ] `textures.ts` (old project, three version): earlier texture reference.
- [ ] Old-project screenshots (localhost:5175 ground view, localhost:5176 trees/fly view): visual target.

---
<sub>Audit: 13/13 sections · 15 rules · 16 corrections · 40 data points · secrets removed: none found · generated by active-memory</sub>
