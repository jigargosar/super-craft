# Super Craft

A Minecraft-themed voxel app, built twice: `three-001/` ("tre", Three.js) and `babylon-001/` ("bab", Babylon.js).

## Information

- tools used: npm (no pnpm), node, vite.

## Rules

1. Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`.
2. Talk first; act only on approval.
3. Never ask or present obviously wrong choices, just because I asked for recommendation. ie. every legitimate mush
   accompany with your recommendation.
4. Report output plainly; never hide failures.
5. Work on `main` only.
6. tre and bab are fully independent: no shared code, no master app. They borrow better tech from each other.
7. (PAUSED while Focus is bab only) Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g.
   the identical `PARAMS` block).
8. Stamp every screenshot "tre" or "bab".
9. Features over docs. Ship features; keep docs minimal; skip nitpicks.
10. Perfection alarm: after 2 rounds polishing the same feature with no new feature added, stop and say
    "⚠ Polishing, not progressing. Move on to <next feature>?" Repeat every round until we move on.
11. When a feature is good enough to show, commit it and go to the next line in Next.
12. (PAUSED while Focus is bab only) Record every tre/bab mismatch in Parity gaps (a separate agent closes them; we keep building features). An
    unlisted mismatch is a bug.
13. Focus: bab only. tre is paused: don't build, test, run or parity-check it until I say so.
14. After every bab commit, rebuild and republish the bab preview artifact
    (https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ), and in every report say whether it is current
    (its build stamp vs HEAD). Never report a feature as done while the preview is stale.
15. Handoff: one file only, `docs/handoff.md` (no number suffix). Each `/amhandoff` overwrites it; git history keeps
    the old ones.

## Parity gaps (one line each: what differs, then "fix" or "skip (reason)")

- Textures (incl. log/leaves): tre = reference port (seed `tex-001`, base + speckles); bab = clustered palettes (seed
  `tex-002`). Different `PARAMS.texture` fields. fix.
- Face shading: bab-only `faceShade` (top 1, z 0.8, x 0.62, bottom 0.5); tre has none. fix.
- Clouds: tre = Sky clouds; bab = CloudProceduralTexture plane (blocky, alpha-tested, drifting, fog-faded edge). fix.
- Walk mode (gravity, jump, collision, F walk/fly, Shift sprint, +/- speed, anti-stuck, LMB break / RMB place (fast-voxel-raycast 0.1.1, unlimited reach), 1-5 block hotbar, [ ] turn speed, localStorage save, Reload / New world buttons (New world = random seed in localStorage, save tagged seed + size, seed in readout), arrow-key turning, click-to-capture HUD prompt, HUD line, `PARAMS.walk`, moveSpeed 12): bab-only. fix.
- Water + sand beaches (water plane at waterLevel 9, swim physics, sand hotbar slot 6): bab-only. fix.
- Day/night cycle (`PARAMS.day`, 10 min day, T fast-forward, clock in readout, time saved): bab-only. fix.
- World size: bab 64x64 (shadowExtent 46, sun distance 90, shadowFar 200, start [70,44,70]); tre 32x32. fix.
- Block-break particles (`PARAMS.burst`, ParticleSystem, tile-textured): bab-only. fix.
- Sky `luminance` 0.6: bab-only. skip (no Three.js Sky equivalent).

## Next (remove each line when done)

last dot is the task we work on.

- [.] Torch / glowstone light block.
- [ ] Tall grass + flowers (cross-quad plants).
- [ ] Sound effects (break/place/step).
