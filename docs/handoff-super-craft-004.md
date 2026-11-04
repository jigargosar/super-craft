# active-memory handoff: Super Craft (voxel app, Three.js "tre" + Babylon.js "bab")

**Handoff #4** · 2026-11-04 · Lineage: #1 (2026-11-03): env set up, two apps scaffolded, lighting/sky parity, previews published; #2 (2026-11-04): docs cleanup (CLAUDE.md only), pnpm → npm + root scripts, 16x16 plains chunk, pointer lock + WASD, pixel textures; #3 (2026-11-04): CLAUDE.md focus/perfection/parity-gap rules, 32x32 forest biome in both apps, then bab-only controls (walk mode, climb, break/place, save, buttons); #4 (2026-11-04): bab agent shipped trees on, hotbar 1-5, random-seed New world, pointerdown click fix; stale preview caught by user; verification agents; CLAUDE.md now says bab only + always republish; bab preview v36 current.

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
- **Current focus (user's call, now in CLAUDE.md rule 13):** **bab only**. tre is paused: don't build, test, run or parity-check it.

## 2. About the user (as relevant to this work)
- Jigar Gosar, GitHub `jigargosar/super-craft`, Windows, WebStorm, repo at `C:\Users\jigar\projects\super-craft`. Uses the Claude desktop app with the artifact open in a side pane.
- Tests **manually in the published claude.ai preview artifact** (not locally). No URL params, menus, or extra steps.
- Very impatient with slow iteration, guessing, over-complicated code, long replies. Moves slow tool runs to background.
- Expects Claude to proactively say when something they'd test is stale ("claude should say that!").
- Told Claude to **forget the old reference files**.

## 3. Style & communication
- **Language:** English.
- **Tone:** direct, no fluff, honest about failures; own mistakes plainly.
- **Reply length:** short. A few numbered lines. No essays, no option surveys.
- **Formatting:** start with "λ ", then state the question/task; numbered lists only (no bullets/dashes), numbering continuous within one reply; shell commands each in their own ```bash block.
- **Working style:** talk first, act on approval; "go" = implement immediately (covers everything pending that was proposed). Commit + push + republish bab preview after every change, then say whether the preview is current. User likes agents doing work while chatting.
- **Avoid:** guessing; complicated math; extra user steps; long explanations; claiming something works untested; reporting "done" while the preview artifact is stale; touching tre.

## 4. Hard rules (word for word)
CLAUDE.md rules (current file, commit 0f09cd9):
1. "Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`."
2. "Talk first; act only on approval."
3. "Never ask or present obviously wrong choices, just because I asked for recommendation. ie. every legitimate mush accompany with your recommendation."
4. "Report output plainly; never hide failures."
5. "Work on `main` only."
6. "tre and bab are fully independent: no shared code, no master app. They borrow better tech from each other."
7. "(PAUSED while Focus is bab only) Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g. the identical `PARAMS` block)."
8. "Stamp every screenshot "tre" or "bab"."
9. "Features over docs. Ship features; keep docs minimal; skip nitpicks."
10. "Perfection alarm: after 2 rounds polishing the same feature with no new feature added, stop and say "⚠ Polishing, not progressing. Move on to <next feature>?" Repeat every round until we move on."
11. "When a feature is good enough to show, commit it and go to the next line in Next."
12. "(PAUSED while Focus is bab only) Record every tre/bab mismatch in Parity gaps (a separate agent closes them; we keep building features). An unlisted mismatch is a bug."
13. "Focus: bab only. tre is paused: don't build, test, run or parity-check it until I say so."
14. "After every bab commit, rebuild and republish the bab preview artifact (https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ), and in every report say whether it is current (its build stamp vs HEAD). Never report a feature as done while the preview is stale."
Said in chat:
15. "forget about parity, havent we stoppend working on tre?"
16. "once code is done commit it, at appropriate break points, so I can evaluate intermediary result."
17. "you need to updae the artifacts, or else How am i supposed to tess"
18. "also search foroums or blog posts for both tre and bab. when we cant get something right in 2 tries."
19. New deps pinned exact latest; leave existing deps alone. No npm lifecycle/"post" scripts.
20. User profile prefs: numbered lists only; backup before overwriting (don't mention); ask overwrite-vs-new before changing an existing file/artifact (the pinned bab preview is always overwritten, rule 14); Tailwind via `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` for HTML pages; repeated content from data + loops; prefer established libraries; surgical comments; numbered-suffix names (001…), confirm name first.
21. Don't recreate Minecraft's actual art; original textures in the same style.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1-32 | (see handoff #2 and #3) | still apply |
| 33 | Relayed agent report "trees are back" but left out "No artifacts were published"; preview stayed at old build 728f99a | Say when the preview is stale; "claude should say that!" → CLAUDE.md rule 14 |
| 34 | Tested a local build and guessed the user saw an old copy | Check the published artifact's build stamp vs HEAD first |
| 35 | Had a verify agent build/run tre and proposed new Parity gaps lines | "forget about parity, havent we stoppend working on tre?" → rule 13 |
| 36 | Bab-only focus lived only in the handoff, not CLAUDE.md | "thats why aked to check claude it should say it" → now in CLAUDE.md |

## 6. Decisions
| Decision | Why |
|---|---|
| Biome: forest-edge plains, 32x32 columns, 48 high, fbm hills, oak trees | approved earlier |
| bab only; tre paused; parity rules 7 + 12 paused | user's call |
| Republish bab preview after every bab commit; report current/stale | user's call (rule 14) |
| Collision = own AABB vs voxel grid | "simple AABB physics" |
| Block raycast: `fast-voxel-raycast` 0.1.1 | established lib |
| Break/place listens to `pointerdown` (Babylon `preventDefaultOnPointerDown` suppresses `mousedown`) | fix 7d0811d |
| Hotbar: Digit1-5 = grass, dirt, stone, log, leaves; default `PARAMS.edit.place` 'dirt'; saved | shipped cd16960 |
| New world = random 6-char seed in localStorage `super-craft-bab-001-seed`; terrain `${seed}`, trees `${seed}-trees`; save tagged `${seed}/${K.size}`; no seed stored = PARAMS seeds | shipped 2e00966 |
| Save: localStorage key `super-craft-bab-001` | earlier |
| Buttons top-right: ↻ Reload, ⟲ New world | earlier |

## 7. Changed / rejected
- parity checks / Parity gaps upkeep → paused (bab only)
- ❌ adding 3 new Parity gaps lines (readout line, `?test` flag, tapped keys) (tre paused)
- ❌ "Parity check tre vs bab… republish both previews" line in Next (removed)
- trees chance 0 (TEMP) → 0.03 (db47fa7)
- New world same seed → random seed
- (older) parallel tre+bab agents, parity agent (worktree `worktree-agent-a79ef938787478809` unmerged), climb variants, keys without pointer lock, ❌ block-grid hash, ❌ reference files, ❌ URL params for user, ❌ Free mouse button, ❌ npm workspaces / Kenney / shared core / pnpm / postinstall

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Node / npm (container) | v22.23.4 / 10.9.9 |
| @babylonjs/core / materials | 9.33.1 / 9.33.1 |
| three / @types/three | 0.187.0 / 0.187.0 |
| fast-voxel-raycast (bab) | 0.1.1 |
| simplex-noise / seedrandom | 4.0.3 / 3.0.5 |
| typescript / vite / concurrently | 7.0.2 / 8.3.5 / 10.0.6 |
| bab preview | https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ (v36, build 0f09cd9, pinned) |
| tre preview | https://claude.ai/artifact/LjNEWmXjpw4ioCcD1QcrDb (v11, paused) |
| HEAD before this handoff commit | 0f09cd9 (origin/main in sync) |
| World fingerprint, default seed (both apps) | world {"trees":20,"grass":1002,"dirt":430,"stone":1076,"log":64,"leaves":878} |
| Random seeds tested | x5a74s 14 trees, b27d61 18, lwgbbl 13, jpnlhp 17, yxsh8i 12; 100k-seed sim min 5 trees, mode 15 |
| Commits this chat | db47fa7 trees on; cd16960 hotbar; 2e00966 random seed; 7d0811d pointerdown fix; 75933e1 CLAUDE.md gap line; 0f09cd9 CLAUDE.md bab-only + rule 14 + Next |

bab PARAMS: as handoff #3 except trees.chance 0.03. Hotbar `selected` saved with the save.

bab controls: click view = capture mouse (Esc releases); WASD; Space jump/up; Shift sprint/down; F walk/fly; R reset; wheel zoom; arrows turn; [ ] turn speed; +/- move speed; LMB break; RMB place selected; 1-5 pick block. Readout: build stamp, seed, fps, x/y/z.

Publish recipe (bab): commit + push, then in `babylon-001`: `VITE_BUILD="$(git rev-parse --short HEAD) $(date -u +%H:%M) UTC" npx vite build --base=./`, then Artifact publish `url` bab preview, `file_path` `babylon-001/dist/index.html`, `root` `babylon-001/dist`, `files` = all `assets/*` (74 files; chunk hashes can change).

Headless test (Claude only): `vite preview --port <free port>`, Playwright `chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']})`, wait ~12 s (2-4 fps), `?test` flag for clicks without pointer lock.

## 9. People, terms & names
- **People:** Jigar Gosar (user, repo owner).
- **Terms:** tre = Three.js app; bab = Babylon.js app; `[.]` in CLAUDE.md Next = current task; "go" = do it.
- **Names in use:** `PARAMS`, `grid`, `heights`, `visibleBlocks`, `selected`, `BLOCK_TYPES`, `SEED_KEY`, `storedSeed`, `WORLD_TAG`, `SAVE_KEY`, `save`, `freeMouse`, `tapped`, `climbDir`.

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| CLAUDE.md | current | 0f09cd9 | rules 1-14; Next: `[.]` Clouds for bab, then atmosphere spike |
| bab trees / New world / reload | verified headless | db47fa7, 2e00966 | by verify agent |
| bab hotbar + break/place | built; verify agent was still running at handoff | cd16960, 7d0811d | real-mouse pointer-lock click unconfirmed |
| bab preview | current | v36, build 0f09cd9 | |
| tre | paused | v11 | don't touch |
| handoff-super-craft-003.md | old | docs/ | superseded |

## 11. Next steps
1. **Next action:** ask the user to confirm trees + LMB/RMB clicks in the bab preview (v36), then start Clouds for bab (`CloudProceduralTexture`), commit, push, republish.
2. Then Spike: Babylon atmosphere addon for an HDR sky.

## 12. Open questions ⚠️
- Hotbar/break-place verify agent result (it was running at handoff; died with the session). Re-verify only if the user reports a problem.
- Do LMB break / RMB place work with a real mouse under pointer lock? Does the capture click also break a block? Unconfirmed.
- Does climbing (single W tap) feel right? Unconfirmed from #3.

## 13. Re-attach checklist
Nothing to attach. (Everything is in the repo `jigargosar/super-craft` on `main`.)

---
<sub>Audit: 13/13 sections · 21 rules · 36 corrections · 40 data points · secrets removed: none found · generated by active-memory</sub>
