# active-memory handoff: Super Craft (voxel app, Three.js "tre" + Babylon.js "bab")

**Handoff #3** · 2026-11-04 · Lineage: #1 (2026-11-03): env set up, two apps scaffolded, lighting/sky parity, previews published; #2 (2026-11-04): docs cleanup (CLAUDE.md only), pnpm → npm + root scripts, 16x16 plains chunk, pointer lock + WASD, pixel textures; #3 (2026-11-04): CLAUDE.md focus/perfection/parity-gap rules, 32x32 forest biome in both apps, then bab-only controls (walk mode, climb, break/place, save, buttons); user frustrated by many guessed iterations on walk/climb.

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
- **Done looks like:** playable, good-looking voxel world (biome terrain, trees, walk/fly, break/place blocks, HUD) like the user's old Babylon project; "be original but not crappy, follow footsteps of minecraft!"
- **Current focus (user's call):** build features in **bab only**; tre catches up later. Features over docs and polish.

## 2. About the user (as relevant to this work)
- Jigar Gosar, GitHub `jigargosar/super-craft`, Windows, WebStorm, repo at `C:\Users\jigar\projects\super-craft`.
- Tests **manually in the published claude.ai preview artifacts** (not locally). Does not want URL params, menus, or any extra steps to test.
- Very impatient with slow iteration, guessing, over-complicated code and long replies. Moves slow tool runs to background.
- Had an older advanced Babylon project (HUD with FPS, XYZ, Mode ground/fly, Biome, Seed). Told Claude to **forget the old reference files**.

## 3. Style & communication
- **Language:** English.
- **Tone:** direct, no fluff, honest about failures.
- **Reply length:** short. A few numbered lines. No essays, no option surveys.
- **Formatting:** start with "λ ", then state the question/task; numbered lists only (no bullets/dashes), numbering continuous within one reply; shell commands each in their own ```bash block.
- **Working style:** talk first, act on approval; when the user says "go"/"just do it", implement immediately. Commit + push + republish the bab preview after every change. Keep code minimal and simple.
- **Avoid:** guessing behavior repeatedly (ask one precise question instead); complicated math where a simple rule works; asking the user to do extra steps (URL params, menus); long explanations; claiming something works without testing it.

## 4. Hard rules (word for word)
CLAUDE.md rules (current file):
1. "Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`."
2. "Talk first; act only on approval."
3. "Never ask or present obviously wrong choices, just because I asked for recommendation. ie. every legitimate mush accompany with your recommendation."
4. "Report output plainly; never hide failures."
5. "Work on `main` only."
6. "tre and bab are fully independent: no shared code, no master app. They borrow better tech from each other."
7. "Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g. the identical `PARAMS` block)."
8. "Stamp every screenshot "tre" or "bab"."
9. "Features over docs. Ship features; keep docs minimal; skip nitpicks."
10. "Perfection alarm: after 2 rounds polishing the same feature with no new feature added, stop and say "⚠ Polishing, not progressing. Move on to <next feature>?" Repeat every round until we move on."
11. "When a feature is good enough to show, commit it and go to the next line in Next."
12. "Record every tre/bab mismatch in Parity gaps (a separate agent closes them; we keep building features). An unlisted mismatch is a bug."
Said in chat:
13. "lets focus on bab, because when you work on multiple features across 2 folders you take ages!!!" (build features in bab only)
14. "forget parity agent" (no agents; still record gaps in CLAUDE.md)
15. "once code is done commit it, at appropriate break points, so I can evaluate intermediary result."
16. "you need to updae the artifacts, or else How am i supposed to tess" (republish preview after every change)
17. "also search foroums or blog posts for both tre and bab. when we cant get something right in 2 tries."
18. New deps pinned exact latest; leave existing deps alone. No npm lifecycle/"post" scripts.
19. User profile prefs: numbered lists only; backup before overwriting (don't mention); ask overwrite-vs-new before changing an existing file/artifact; Tailwind via `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` for HTML pages; repeated content from data + loops; prefer established libraries; surgical comments; numbered-suffix names (001…), confirm name first.
20. Don't recreate Minecraft's actual art; original textures in the same style.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1-16 | (see handoff #2: docs cleanup, naming, deps, textures, screenshots, "go" means go) | still apply |
| 17 | Claimed reference files available | No access; "forget about the reference files" |
| 18 | Proposed a block-grid hash for parity | Later, after features; record mismatches in CLAUDE.md instead |
| 19 | Worked tre + bab in parallel per feature | bab only (too slow across 2 folders) |
| 20 | Kept a parity agent running | "forget parity agent"; stopped, its worktree commits left unmerged |
| 21 | R reset to overview / canopy top / facing leaf wall | R = stand on the ground inside the forest, open view ahead |
| 22 | Look speed 0.002 rad/px | 0.001, plus [ ] keys to adjust |
| 23 | No wheel zoom | Mouse wheel dolly zoom |
| 24 | v15 made keys work without pointer lock (mouse escaped window) | Controls only after clicking into the view; HUD controls text only after capture (v16 behavior "is good") |
| 25 | Many climb variants (auto-step teleport, auto-jump, smooth climb, ground-only, tallest-column snap, eased rise) | Simple: push into ANY block from the ground → go up onto the top, starting instantly; a single W tap must be enough; no overshoot, no falling back on the source block |
| 26 | Removed climb entirely (plain AABB) | User got stuck in 2-high pits; climb is required |
| 27 | Added `?test` URL flag and "Free mouse" button for testing | User doesn't want extra testing steps; `?test` is only for Claude's headless tests |
| 28 | Kept polishing walk feel ~15 rounds; asked many questions | Follow CLAUDE.md (perfection alarm, Next list); ask one precise question instead of guessing |
| 29 | Long replies | Short replies |
| 30 | Wrote the handoff before finishing the pending fix | "you do the fix first, then handoff with the fix!!" |

## 6. Decisions
| Decision | Why |
|---|---|
| Biome: forest-edge plains, 32x32 columns, 48 high, fbm hills, oak trees | Claude's proposal, approved ("g") |
| Features in bab first; tre later; gaps recorded in CLAUDE.md "Parity gaps" | user's call |
| Collision = own AABB vs voxel grid (per-axis, ≤0.4 substeps) | thin instances have no colliders; user: "simple AABB physics" |
| Go-to-top climb: push from ground starts `climbDir`; rise 10 b/s until body fits `climbNudge` 0.35 ahead, then step on; continues after W release | user's rule, verified by headless tap test |
| Block raycast: `fast-voxel-raycast` 0.1.1 | established lib over hand-written DDA |
| Save: localStorage key `super-craft-bab-001` (edits, pos, rot, mode, boost, look) | user: "across refresh nothing is saved" |
| Buttons top-right: 🖱 Free mouse, ↻ Reload, ⟲ New world | user: "refresh button is there?" (menus too painful) |
| App label top-left in index.html ("tre · Three.js" / "bab · Babylon.js") | user asked |

## 7. Changed / rejected
- tre+bab parallel agents per feature → bab only
- parity agent (worktree branch `worktree-agent-a79ef938787478809`, commits 842f600 bab textures→tre style, 2055efa tre faceShade, 4bb64bc bab clouds) → stopped, NOT merged
- plains 16x16 chunk → 32x32 forest-edge plains
- auto-step teleport → auto-jump → smooth climb → ground-only → snap to tallest column → eased rise → removed → current climbDir climb
- keys without pointer lock (v15) → controls gated on pointer lock (v16)
- ❌ block-grid hash now (later maybe)
- ❌ reference files from old project (forget them)
- ❌ URL params for the user
- (from #2) ❌ npm workspaces, Kenney pack, bumping existing deps, LF/rebase rules, shared core, pnpm, postinstall

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Node / npm (container) | v22.23.4 / 10.9.9 |
| three / @types/three | 0.187.0 / 0.187.0 |
| @babylonjs/core / materials | 9.33.1 / 9.33.1 |
| fast-voxel-raycast (bab) | 0.1.1 (types in `babylon-001/src/fast-voxel-raycast.d.ts`) |
| simplex-noise / seedrandom | 4.0.3 / 3.0.5 |
| typescript / vite / concurrently | 7.0.2 / 8.3.5 / 10.0.6 |
| tre preview | https://claude.ai/artifact/LjNEWmXjpw4ioCcD1QcrDb (v11) |
| bab preview | https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ (v32) |
| Latest commit | cc08032 (main, pushed) |
| World fingerprint (trees on, both apps) | world {"trees":20,"grass":1002,"dirt":430,"stone":1076,"log":64,"leaves":878} |

bab PARAMS (current):
- camera: fovDeg 70, near 0.1, far 2000, position [40,34,40], target [0,10,0], lookSpeed 0.001, lookStep 1.25, lookRange [0.2,5], turnSpeed 1.8, wheelStep 1.5, eyeHeight 1.7, clearView 6, moveSpeed 12, boostStep 1.5, boostRange [0.25,8]
- edit: reach 1000, place 'dirt'
- walk: speed 7, sprint 2, gravity 28, jumpSpeed 9, height 1.8, radius 0.3, fallResetY -20, climbNudge 0.35, riseSpeed 10
- sun: shadowExtent 26, distance 60, shadowFar 140 (rest as handoff #2)
- chunk: size 32, maxHeight 48, seed 'forest-plains-001', baseHeight 2, amplitude 20, noiseScale 0.035, octaves 4, persistence 0.5, lacunarity 2, dirtDepth 3
- trees: seed 'trees-001', **chance 0 (TEMP, was 0.03)**, minSpacing 4, minTrunk 4, maxTrunk 6, margin 2
- tre: same chunk/trees(0.03)/camera except tre has lookSpeed 0.001, wheelStep, eyeHeight, clearView, R reset; no walk/edit/save.

bab controls: click view = capture mouse (Esc releases); WASD; Space jump (walk) / up (fly); Shift sprint (walk) / down (fly); F walk/fly; R reset to forest floor (walk); wheel zoom; arrows turn; [ ] turn speed; +/- move speed; LMB break; RMB place dirt. Start = fly at overview.

Headless test recipe (Claude only): `vite build --base=./`, `vite preview --port 4302 --strictPort`, Playwright with `NODE_PATH=/opt/node22/lib/node_modules`, args `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, open `/?test`, read `window.__bab.camera.position`. Avoid ports 4101/4102 if anything else runs. tre screenshots often time out.

Publish recipe: `npx vite build --base=./` in app dir, then Artifact publish `file_path` `<app>/dist/index.html`, `root` `<app>/dist`, `files` = changed `assets/index-*.js`.

## 9. People, terms & names
- **People:** Jigar Gosar (user, repo owner).
- **Terms:** tre = Three.js app; bab = Babylon.js app; `[.]` in CLAUDE.md Next = current task; "go-to-top" = climb onto a block you push into.
- **Names in use:** `PARAMS`, `gen`/`centerEye`, `grid`, `get`/`set`/`inside`/`idx`, `heights`, `visibleBlocks`, `rebuildChunk`, `setInstances`, `bodyHits`, `lastHit`, `moveCollide`, `climbDir`, `onGround`, `mode`, `boost`, `look`, `edits`, `save`, `SAVE_KEY`, `freeMouse`, `hud`, `showHud`, `setMode`, `resetPose`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| CLAUDE.md | rules 1-12 + Parity gaps + Next | repo root | Next list stale: biome `[.]` done but unticked; controls not listed |
| Biome chunk (both) | done | 8f6ed78 / b1703d5 | trees TEMP off in bab |
| bab walk/fly/climb | working, tap-tested | 9daff5d, cc08032 | lost quick taps fixed in cc08032 (`tapped` set holds a key for ≥1 frame); post-fix headless test could not complete (headless runs at ~7 fps and kept timing out) |
| bab position readout | built | cc08032 | top-left 3rd line: fps, x, y (feet), z, ground/climbing; for diagnosing jerky look |
| bab break/place | built, untested by Claude (needs pointer lock) | 4a2d71c | user hasn't confirmed |
| bab save + buttons | built, headless-tested | c883ca6, 7b73e69 | |
| tre | behind bab | v11 | missing all bab controls |
| handoff-super-craft-002.md | old | repo root | superseded by this file |

## 11. Next steps
1. **Next action:** ask the user the fps shown in the readout during the jerky look, and fix the jerky mouse look during jump/climb (first: stop writing hud/pos DOM every frame).
2. Clean up CLAUDE.md Next (tick the biome task; add lines: bab controls done, trees back on, hotbar 1-5, tre catch-up), ask the user which feature is `[.]`.
3. Put trees back (`trees.chance` 0 → 0.03) once the user confirms climbing works.
4. Then the user's chosen next feature (candidates: block hotbar, HUD FPS/XYZ/biome, clouds for bab, tre catch-up).

## 12. Open questions ⚠️
- Does v31 climbing (single W tap) now feel right to the user? Unconfirmed.
- Does LMB break / RMB place work for the user? Unconfirmed.
- "Angle mismatch" the user mentioned once: never explained.
- User: "during jump or auto jump are you restricting angular movement, because it only works in jerks or not at all!!!" — the code does NOT restrict rotation during jump/climb (camera.inertia = 0, Babylon mouse input untouched). Unverified suspicion: low FPS or per-frame HUD/readout DOM writes (`hud.style.background` and `pos.textContent` set every frame). Ask the user what fps the readout shows while it happens, then fix (e.g. only write DOM when the text changes).
- Keep or remove the 🖱 Free mouse button? (user seemed annoyed by it; unanswered)
- "New world" currently resets to the same seed; user asked "new world does what" — random seed wanted? Unanswered.

## 13. Re-attach checklist
Nothing to attach. (Everything is in the repo `jigargosar/super-craft` on `main`.)

---
<sub>Audit: 13/13 sections · 20 rules · 30 corrections · 60 data points · secrets removed: none found · generated by active-memory</sub>
