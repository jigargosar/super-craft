# Super Craft

A Minecraft-themed voxel app, built twice: `three-001/` ("tre", Three.js) and `babylon-001/` ("bab", Babylon.js).

## Rules
1. Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`.
2. Talk first; act only on approval. Ask one question at a time, always with a recommendation.
3. Check before running anything. Report output plainly; never hide failures.
4. Work on `main` only.
5. tre and bab are fully independent: no shared code, no master app. They borrow better tech from each other.
6. Parity check: after any change, confirm both apps still match in settings and behavior, using equivalent APIs (e.g. the identical `PARAMS` block).
7. New dependencies: pin an exact version, the latest. Leave existing ones unless an update is needed.
8. Stamp every screenshot "tre" or "bab".
9. Short replies.

## Next (remove each line when done)
10. Clouds for bab: try `CloudProceduralTexture` (tre's sky already has clouds).
11. Parity check tre vs bab with stamped screenshots; republish both preview artifacts.
12. Spike: Babylon atmosphere addon for an HDR sky.
