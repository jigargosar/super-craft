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

## Next (remove each line when done)

last dot is the task we work on.

- [ ] Clouds for bab: try `CloudProceduralTexture` (tre's sky already has clouds).
- [ ] Parity check tre vs bab with stamped screenshots; republish both preview artifacts.
- [ ] Spike: Babylon atmosphere addon for an HDR sky.
- [.] Build a chunk of appropriate size of a particular biome.
