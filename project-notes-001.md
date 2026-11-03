# Super Craft: project notes (001)

Everything known as of 2026-11-03. Part A is facts only. Part B is Claude's opinions.
Nothing here is decided unless Part A says "decided by user".

---

# Part A: Facts

## A1. Goal (decided by user)
1. Minecraft-themed voxel app, built twice as two fully independent apps: `three-001/` (Three.js, "tre") and `babylon-001/` (Babylon.js, "baby").
2. No master app. Both reach the same effect with equivalent APIs and similar parameters (not pixel-perfect). Each borrows better tech from the other.

## A2. Repository
1. GitHub: `jigargosar/super-craft`, branch `main` only.
2. Root files: `CLAUDE.md`, `project-notes-001.md` (this file), `handoff-super-craft-001.md`, `.gitattributes` (`* text=auto eol=lf`), `.gitignore` (`.idea`).
3. Each app: own `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `index.html`, `src/main.ts`, `src/style.css`.
4. No hooks, no `.claude/` folder. A SessionStart hook script was written, tested, then removed at user request (git history: commits `18fb6dd`, `0492f12`).

## A3. Pinned versions (all latest on the registry when checked)
| Package | Version |
|---|---|
| pnpm (`packageManager`) | 12.16.1 |
| Node (`devEngines.runtime`) | 26.13.0 (LTS) |
| three / @types/three | 0.187.0 / 0.187.0 |
| @babylonjs/core / @babylonjs/materials | 9.33.1 / 9.33.1 |
| typescript | 7.0.2 |
| vite | 8.3.5 |

1. Babylon 9.33.2 exists (published 2026-11-02T20:57Z). pnpm's minimum-release-age rule held it back after `babylon-001/pnpm-workspace.yaml` (which held an exemption) was deleted at user request.
2. No Babylon or Three package has install/postinstall scripts. `pnpm approve-builds --all` reported "There are no packages awaiting approval" in both apps.

## A4. Cloud container environment (this session; resets on every new container)
1. Preinstalled: Node v22.23.4 + npm 10.9.9 at `/opt/node22/bin`, which is on PATH by default.
2. Installed this session: pnpm 12.16.1 via `curl -fsSL https://get.pnpm.io | sh -` into `/root/.local/share/pnpm`; Node 26.13.0 via `pnpm runtime set node lts -g`.
3. The pnpm installer adds PATH lines to `~/.bashrc` only. Non-interactive shells (Claude's tool shell) did not see pnpm until PATH was fixed manually.
4. Claude's tool shell PATH order (snapshot): `/root/.local/bin` comes before `/opt/node22/bin`; `/usr/local/bin` comes after it.
5. Node installed via `pnpm runtime` does not include npm/npx/corepack.
6. Network: `pnpm.io` was not reachable via WebFetch; `get.pnpm.io` and the Node download worked via curl/pnpm.

## A5. Cloud environment setup script (from official docs)
1. Configured in the environment settings (session title bar → environment → Edit → Setup script). Not stored in the repo.
2. Runs as root on Ubuntu 24.04, before Claude Code launches.
3. Result is cached as a filesystem snapshot for about 7 days; rebuilt when the script or network hosts change. Must finish in ~5 minutes to be cached. Non-zero exit = session fails to start.
4. Docs recommend: setup script for toolchains; SessionStart hook for project installs like `npm install`.
5. Docs do not say whether the repo is already cloned when the setup script runs.
6. Not yet configured by the user.

User's draft setup script:
```bash
#!/bin/bash
set -euo pipefail
ROOT=/home/user/super-craft
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=12.16.1 sh -
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME/bin:$PATH"
pnpm runtime set node 26.13.0 -g -y
grep -q PNPM_HOME ~/.profile || echo 'export PNPM_HOME="$HOME/.local/share/pnpm"; export PATH="$PNPM_HOME/bin:$PATH"' >> ~/.profile
cd "$ROOT/three-001" && pnpm install --frozen-lockfile
cd "$ROOT/babylon-001" && pnpm install --frozen-lockfile
pnpm -v
node -v
```

## A6. Git workflow (decided by user)
1. Work on `main` only. Rebase, never merge.
2. User's WebStorm: Update method = Rebase. `pull.rebase true` set (repo-local).
3. User wants line-ending settings global: `git config --global core.autocrlf input` and `git config --global core.eol lf` were proposed (user has not confirmed they ran them).
4. `.gitattributes` forces LF in the repo.

## A7. App scenes (current state, both apps)
1. Same scene: 64x64 floor, 1x1x1 cube, Preetham sky, hemisphere + ambient + directional sun with 2048 shadow map, orbit camera.
2. Identical `PARAMS` block in both `src/main.ts`:
```ts
camera: { fovDeg: 70, near: 0.1, far: 2000, position: [6, 5, 8], target: [0, 0.5, 0] },
sun: { polarDeg: 50, azimuthDeg: 30, color: '#ffffff', intensity: 2, shadowMapSize: 2048 },
hemi: { sky: '#bfd8ff', ground: '#6b5a3a', intensity: 0.8 },
ambient: { color: '#ffffff', intensity: 0.2 },
sky: { size: 1000, turbidity: 2, rayleigh: 1, mieCoefficient: 0.005, mieDirectionalG: 0.8, luminance: 0.6 },
floor: { size: 64, color: '#5b8c3a', roughness: 1, metalness: 0 },
cube: { size: 1, color: '#8b5a2b', roughness: 1, metalness: 0 },
```
3. API pairs used (tre ↔ baby):

| Part | tre | baby |
|---|---|---|
| Material | `MeshStandardMaterial` | `PBRMaterial` |
| Tone mapping | `renderer.toneMapping = ACESFilmic` | `imageProcessingConfiguration` ACES |
| Sun | `DirectionalLight` | `DirectionalLight` + `ShadowGenerator` (PCF) |
| Hemisphere | `HemisphereLight` | `HemisphericLight` |
| Ambient | `AmbientLight` | `scene.ambientColor` × `material.ambientColor` |
| Sky | `Sky` addon (WebGL) | `SkyMaterial` |
| Camera | `PerspectiveCamera` + `OrbitControls` | `ArcRotateCamera` |

4. baby specifics: `scene.useRightHandedSystem = true`; every hex color converted with `.toLinearSpace()`; `luminance` is baby-only.

## A8. Sky and clouds research
1. tre `Sky` (three 0.187): newer Preetham rewrite with noise clouds (`cloudCoverage` 0.4, `cloudDensity` 0.4, `cloudScale` 0.0002, `cloudSpeed` 0.00002, `cloudElevation` 0.5); output goes through renderer ACES.
2. baby `SkyMaterial`: classic Preetham with built-in Uncharted2 tone mapping controlled by `luminance`. `cloudiness` only softens the sun disc; no clouds.
3. baby cloud options found: official atmosphere addon `@babylonjs/addons/atmosphere` (HDR sky, no clouds); community volumetric clouds plugin (heavy); `CloudProceduralTexture`; or port tre's cloud GLSL.
4. Current visual difference: baby sky slightly bluer at top; tre has clouds, baby has none.

## A9. Manual testing
1. Private claude.ai preview artifacts (built with `vite build --base=./`), version 2 = commit `d8d55a2` state:
   1. tre: https://claude.ai/artifact/LjNEWmXjpw4ioCcD1QcrDb
   2. baby: https://claude.ai/artifact/6VKqC5eoPHUeyQe5CxsyLJ
2. User can also run locally: `pnpm i` then `pnpm dev` in each app folder.

## A10. Tooling in use
1. active-memory plugin: `/amcodeword`, `/amcheckpoint`, `/amhandoff`, `/amhelp`, `/amsetup`. Code word "λ" set via `CLAUDE.md`.
2. Python 3.13.18 present in the container (plugin's automatic checks work).

---

# Part B: Claude's opinions

## B1. What is messed up (to discuss one by one)
1. **Environment setup has three overlapping answers:** `CLAUDE.md` manual steps, the (not yet configured) environment setup script, and the removed hook. Pick one owner.
2. **`CLAUDE.md` startup steps disagree with pins:** step 5 says `lts`, pins say 26.13.0 exactly; step 3 doesn't pin pnpm 12.16.1.
3. **Two "source of truth" files:** `handoff-super-craft-001.md` and this file overlap. Keep one.
4. **Babylon 9.33.1 vs 9.33.2:** violates "always latest" until 9.33.2 passes pnpm's release-age window, or the exemption comes back.
5. **Line endings:** unclear whether the global git settings were applied on the user's machine.

## B2. Recommendations
1. Environment: use the setup script for pnpm + Node only (pinned versions, plus `ln -sf` into `~/.local/bin` so Claude's shell sees them). Keep `pnpm install` per app as a manual `CLAUDE.md` step, since a cached snapshot can hold stale `node_modules`.
2. Pin the `CLAUDE.md` steps to exact versions to match `package.json`.
3. Make this file the single source of truth; retire the handoff file into it.
4. Wait for Babylon 9.33.2 to age, then bump; no exemption file.
5. Clouds for baby: start with `CloudProceduralTexture`; try the atmosphere addon later as a spike.
