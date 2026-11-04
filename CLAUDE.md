# Super Craft

A Minecraft-themed voxel app, built twice: `three-001/` ("tre", Three.js) and `babylon-001/` ("baby", Babylon.js).

## Code word
1. Start every reply with "λ" and a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`.

## Setup (new cloud container; check each step, skip if already done)
2. Install pnpm: `curl -fsSL https://get.pnpm.io | sh -`
3. Make pnpm visible to Claude's shell: `ln -sf ~/.local/share/pnpm/bin/pnpm ~/.local/bin/pnpm`
4. Install Node LTS: `pnpm runtime set node lts -g`
5. Make Node visible: `ln -sf ~/.local/share/pnpm/bin/node ~/.local/bin/node`
6. Verify: `pnpm -v` should print 12.16.1 and `node -v` should print v26.13.0.
7. Install deps: run `pnpm install` in `three-001/`, then in `babylon-001/`.

## Rules
8. Talk first; act only on approval. Ask one question at a time, always with a recommendation.
9. Check before running anything. Report output plainly; never hide failures.
10. Work on `main` only. Rebase, never merge.
11. LF line endings only.
12. The two apps are fully independent: no shared code, no master app. Keep `PARAMS` identical in both `src/main.ts`, use equivalent APIs, and borrow better tech from each other.
13. Pin every dependency to an exact version, always the latest.
14. Stamp every screenshot "tre" or "baby".
15. Short replies. Numbered lists only; numbering restarts each reply.
