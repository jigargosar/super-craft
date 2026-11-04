# Super Craft

A Minecraft-themed voxel app, built twice: `three-001/` ("tre", Three.js) and `babylon-001/` ("baby", Babylon.js).

## Code word
1. Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`.

## Setup
2. Use the machine's own Node (22.12 or newer) and npm. No pnpm.
3. Install deps: run `npm install` in `three-001/`, then in `babylon-001/`. Skip if `node_modules` exists.

## Rules
4. Talk first; act only on approval. Ask one question at a time, always with a recommendation.
5. Check before running anything. Report output plainly; never hide failures.
6. Work on `main` only. Rebase, never merge.
7. LF line endings only.
8. The two apps are fully independent: no shared code, no master app. Keep `PARAMS` identical in both `src/main.ts`, use equivalent APIs, and borrow better tech from each other.
9. Pin every dependency to an exact version, always the latest.
10. Stamp every screenshot "tre" or "baby".
11. Short replies. Numbered lists only; numbering restarts each reply.
