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
7. Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g.
   the identical `PARAMS` block).
8. Stamp every screenshot "tre" or "bab".
9. Features over docs. Ship features; keep docs minimal; skip nitpicks.
10. Perfection alarm: after 2 rounds polishing the same feature with no new feature added, stop and say
    "⚠ Polishing, not progressing. Move on to <next feature>?" Repeat every round until we move on.
11. When a feature is good enough to show, commit it and go to the next line in Next.
12. Record every tre/bab mismatch in Parity gaps (a separate agent closes them; we keep building features). An
    unlisted mismatch is a bug.

## Parity gaps (one line each: what differs, then "fix" or "skip (reason)")

- Textures (incl. log/leaves): tre = reference port (seed `tex-001`, base + speckles); bab = clustered palettes (seed
  `tex-002`). Different `PARAMS.texture` fields. fix.
- Face shading: bab-only `faceShade` (top 1, z 0.8, x 0.62, bottom 0.5); tre has none. fix.
- Clouds: tre sky has clouds; bab has none. fix.
- Walk mode (gravity, jump, collision, F walk/fly, Shift sprint, +/- speed, climb any block when bumped from the ground, anti-stuck, arrow-key turning, click-to-capture HUD prompt, HUD line, `PARAMS.walk`, moveSpeed 12): bab-only. fix.
- Sky `luminance` 0.6: bab-only. skip (no Three.js Sky equivalent).

## Next (remove each line when done)

last dot is the task we work on.

- [ ] Clouds for bab: try `CloudProceduralTexture` (tre's sky already has clouds).
- [ ] Parity check tre vs bab with stamped screenshots; republish both preview artifacts.
- [ ] Spike: Babylon atmosphere addon for an HDR sky.
- [.] Build a chunk of appropriate size of a particular biome.
