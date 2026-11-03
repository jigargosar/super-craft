# Super Craft — design notes (001)

Minecraft-themed voxel app, built twice as two fully independent apps (no shared code, no comparison goal).

## Decisions
1. Two apps at repo root: `three-001/` (Three.js) and `babylon-001/` (Babylon.js), each its own Vite project.
2. Vite + TypeScript for both.
3. pnpm as package manager; Node pinned per app via `devEngines.runtime` (`pnpm runtime set node`).
4. Everything pinned exactly, always latest.
5. Build first, research as we go (record findings below). Move fast, let it break.
6. Work on `main`.
7. Original art/textures; no Minecraft name or assets.

## Pinned versions (2026-11-03)
1. pnpm 12.16.1, Node 26.13.0 (LTS), Vite 8.3.5, TypeScript 7.0.2
2. three 0.187.0 + @types/three 0.187.0
3. @babylonjs/core 9.33.2 + @babylonjs/materials 9.33.2

## Starter scene (both apps)
1. Floor, sky, one 1x1x1 cube, orbit camera.
2. Lights: hemisphere + ambient + directional sun with shadows.

## Findings
1. `pnpm runtime` exists from pnpm 11+ (machine has 10.28). Use `pnpm self-update` to upgrade.
2. `pnpm runtime set node` download was blocked here: host `unofficial-builds.nodejs.org` denied by network policy. Pin was written by hand.
3. Three.js `Sky` addon is WebGL-only; WebGPU renderer needs `SkyMesh`. App currently uses `WebGLRenderer`.
4. Babylon.js has no AmbientLight class: ambient = `scene.ambientColor` × `material.ambientColor`.

## Open questions
1. WebGL vs WebGPU renderer in each app.
