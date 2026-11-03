# Super Craft: session rules

## Code word
1. Start every reply with exactly "λ" followed by a space. If a reply lacks it, the chat is losing track: suggest `/amhandoff`.

## Resume work
2. Read `handoff-super-craft-001.md` (latest handoff) before doing anything else.

## Startup steps (fresh cloud container; check each before running, skip if already done)
3. Install pnpm: `curl -fsSL https://get.pnpm.io | sh -`
4. Make pnpm visible to this shell: `ln -sf ~/.local/share/pnpm/bin/pnpm ~/.local/bin/pnpm`
5. Install Node LTS: `pnpm runtime set node lts -g`
6. Make Node visible: `ln -sf ~/.local/share/pnpm/bin/node ~/.local/bin/node`
7. Verify: `pnpm -v` (expect 12.16.1) and `node -v` (expect v26.13.0)
8. Install deps: `cd three-001 && pnpm install`, then `cd babylon-001 && pnpm install`

## Rules
9. Talk first, act only on approval. One question at a time, always with a recommendation.
10. Check first before running anything. Report output plainly, never hide failures.
11. Always work on `main`. Rebase only, never merge.
12. LF line endings only.
13. Two fully independent apps: `three-001/` (tre) and `babylon-001/` (baby). Keep `PARAMS` identical in both `src/main.ts`; use equivalent APIs; borrow better tech from each other. No master app.
14. All dependencies pinned exact, always latest.
15. Stamp every screenshot "tre" or "baby".
16. Numbered lists only; numbering restarts each reply. Short replies, no essays.
