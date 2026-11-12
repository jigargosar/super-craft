// babylon-001 scene: one forest-edge plains chunk (64x64 blocks, trees) + sky + hemispheric/ambient/sun lights.
// PARITY: three-001/src/main.ts mirrors this file. PARAMS match except gaps listed in CLAUDE.md "Parity gaps";
// change a value in one, change it in the other. API pairs are noted per section.
// Gotchas vs three: (1) right-handed system turned on so coordinates match three;
// (2) PBR needs linear colors, so every hex goes through lin(); (3) no AmbientLight class,
// ambient = scene.ambientColor × material.ambientColor.
import './style.css'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent' // side-effect: enables shadows
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Matrix, Vector3, Vector4 } from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/core/Meshes/thinInstanceMesh' // side-effect: enables thin instances
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial'
import { CloudProceduralTexture } from '@babylonjs/procedural-textures/cloud/cloudProceduralTexture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Material } from '@babylonjs/core/Materials/material'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { CreateLineSystem } from '@babylonjs/core/Meshes/Builders/linesBuilder'
import '@babylonjs/core/Materials/Textures/Procedurals/proceduralTextureSceneComponent' // side-effect: renders procedural textures
import { createNoise2D, createNoise4D } from 'simplex-noise'
import seedrandom from 'seedrandom'
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem'
import '@babylonjs/core/Particles/particleSystemComponent' // side-effect: scene renders particle systems
import raycast from 'fast-voxel-raycast' // voxel DDA ray walk (used by the noa engine)
import type { Mesh } from '@babylonjs/core/Meshes/mesh'

// --- PARAMS (keep identical in both apps) ---
const PARAMS = {
  camera: {
    fovDeg: 70,
    near: 0.1,
    far: 2000,
    position: [70, 44, 70],
    target: [0, 10, 0],
    lookSpeed: 0.001, // radians per mouse pixel (pointer lock)
    lookStep: 1.25, // [ / ] keys divide/multiply mouse + arrow turn speed by this, clamped to lookRange
    lookRange: [0.2, 5],
    turnSpeed: 1.8, // arrow keys: radians per second (←→ turn, ↑↓ look up/down); only while the mouse is captured
    wheelStep: 1.5, // blocks moved along the view direction per mouse-wheel notch (zoom)
    eyeHeight: 1.7, // R reset: stand on the ground nearest the chunk center (inside the forest)
    clearView: 6, // R reset: blocks of open air required ahead at eye level, so you don't face a leaf wall
    moveSpeed: 12, // fly mode: blocks per second (WASD, Space up, Shift down)
    boostStep: 1.5, // +/- keys multiply/divide all move speeds by this (both modes), clamped to boostRange
    boostRange: [0.25, 8],
  },
  // edit: block breaking/placing. reach = max ray length in blocks (1000 = effectively unlimited); place = default hotbar block.
  edit: { reach: 1000, place: 'dirt' as BlockType },
  // plants (bab-only): cross-quad tall grass / flowers on grass tops, not solid, not saved (regrown from the seed;
  // a plant vanishes when its cell gets a block or the grass under it is removed).
  plants: {
    grass: 0.18,
    flower: 0.03,
    bladeDensity: 0.6,
    stem: '#3f7a2a',
    petal: '#d8433a',
    center: '#f2d23c',
  },
  // burst: block-break particles (bab-only). Each particle shows the broken block's icon tile.
  burst: {
    count: 24,
    size: [0.08, 0.18],
    life: [0.35, 0.8],
    power: [1.5, 3],
    gravity: 18,
  },
  // walk: player physics (bab-only for now). Body = box radius×2 wide, `height` tall; eyes at camera.eyeHeight.
  // Jump apex = jumpSpeed² / (2 × gravity) ≈ 1.45 blocks, enough to climb one block.
  walk: {
    speed: 7, // blocks per second
    sprint: 2, // speed × this while Shift is held (walk mode; Shift = down in fly mode)
    gravity: 28,
    jumpSpeed: 9,
    height: 1.8,
    radius: 0.3,
    fallResetY: -20,
    climbNudge: 0.35, // go-to-top: blocks moved onto the top once the body clears the edge
    riseSpeed: 10, // go-to-top: blocks per second while rising onto a block you walked into
  },
  sun: {
    polarDeg: 50,
    azimuthDeg: 30,
    color: '#ffffff',
    intensity: 2,
    shadowMapSize: 2048,
    shadowBias: 0.0005, // depth bias against shadow acne
    shadowNormalBias: 0.02, // offset along normals against acne on block faces
    shadowExtent: 46, // half-size of the shadow box around the chunk (blocks)
    distance: 90, // light placed at sunDir * distance
    shadowFar: 200, // shadow camera far plane (↔ three shadow.camera.far)
  },
  // day (bab-only): day/night cycle. time = fraction of a day (0.25 sunrise, 0.5 noon, 0.75 sunset);
  // start matches sun.polarDeg 50 (40° up, morning). Hold T to fast-forward ×fastForward. Sun crosses the sky
  // on the sun.azimuthDeg vertical plane; light fades over the `twilight` elevation band (sin of elevation).
  day: {
    length: 600,
    start: 0.361,
    fastForward: 40,
    twilight: 0.25,
    night: 0.12,
  },
  hemi: { sky: '#bfd8ff', ground: '#6b5a3a', intensity: 0.8 },
  ambient: { color: '#ffffff', intensity: 0.2 },
  // luminance: babylon-only (its sky has built-in tone mapping; 0.6 matches three's ACES look)
  sky: {
    size: 1000,
    turbidity: 2,
    rayleigh: 1,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
    luminance: 0.6,
  },
  // clouds (bab-only): CloudProceduralTexture (fbm noise) on one big plane; alpha = noise, so `cutoff` decides
  // coverage (higher = fewer clouds). texSize low + NEAREST sampling = blocky voxel-style clouds.
  // Scene fog (start/end in blocks, `fog` = horizon color) fades the plane's far edge into the sky.
  clouds: {
    height: 70,
    size: 1600,
    texSize: 128,
    amplitude: 0.55,
    octaves: 4,
    cutoff: 0.55,
    opacity: 0.85,
    drift: 1.5, // blocks per second along +x
    fog: '#c4d8ee',
    fogStart: 200,
    fogEnd: 700,
  },
  // chunk: forest-edge plains. height = baseHeight + amplitude * (fbm + 1) / 2, fbm in [-1, 1]
  chunk: {
    size: 64,
    maxHeight: 48,
    seed: 'forest-plains-001',
    baseHeight: 2,
    amplitude: 20,
    noiseScale: 0.035,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    dirtDepth: 3,
    // water (bab-only): one translucent plane at waterLevel (no water blocks). Columns whose top is at most
    // waterLevel + beach get sand instead of grass/dirt; trees skip them. In water: slower moves, slow sink, Space swims up.
    waterLevel: 9,
    beach: 1,
    water: {
      color: '#2f6fd0',
      alpha: 0.6,
      speed: 0.5,
      gravity: 0.25,
      swimSpeed: 3.5,
    },
  },
  // trees: oak. Per column (inside margin) roll `chance`; skip if another tree within minSpacing (Chebyshev).
  trees: {
    seed: 'trees-001',
    chance: 0.03,
    minSpacing: 4,
    minTrunk: 4,
    maxTrunk: 6,
    margin: 2,
  },
  blocks: {
    roughness: 1,
    metalness: 0,
  },
  // faceShade: fixed brightness per face direction (classic voxel look; sides differ so edges read)
  faceShade: { top: 1, z: 0.8, x: 0.62, bottom: 0.5 },
  // texture: 16x16 pixel-art tiles in one atlas. Each pixel = palette[i], where i comes from
  // seamless simplex noise (clumps; `scale` = clump frequency) mixed with `grain` of per-pixel random.
  // Palettes run dark → light. grassSide = dirt with a ragged grass overhang of minRows..maxRows per column.
  texture: {
    size: 16,
    seed: 'tex-002',
    grassTop: {
      palette: ['#4a8530', '#56963a', '#62a443', '#6fb14d', '#7dbe58'],
      scale: 0.45,
      grain: 0.35,
    },
    dirt: {
      palette: ['#5b3d25', '#68472c', '#765235', '#845e3f'],
      scale: 0.5,
      grain: 0.45,
    },
    stone: {
      palette: ['#6c6c6c', '#797979', '#868686', '#939393'],
      scale: 0.22,
      grain: 0.25,
      cracks: 3,
      crack: '#5a5a5a',
    },
    grassSide: { minRows: 2, maxRows: 5, edge: '#3f7429' },
    // logSide: vertical bark streaks = one palette pick per column, `grain` share of per-pixel random.
    logSide: { palette: ['#584026', '#6b4f2e', '#7d5c36'], grain: 0.3 },
    // logTop: end grain = square rings alternating `rings` colors, 1px bark `rim`.
    logTop: { rings: ['#a07a4a', '#8a6638'], rim: '#6b4f2e' },
    leaves: {
      palette: ['#2c5c1d', '#356b23', '#3f7a2a', '#4c8c34'],
      scale: 0.6,
      grain: 0.4,
    },
    sand: {
      palette: ['#cdb57a', '#d8c088', '#e2cb94', '#ead6a2'],
      scale: 0.5,
      grain: 0.5,
    },
  },
} as const

const lin = (hex: string) => Color3.FromHexString(hex).toLinearSpace() // sRGB hex → linear (three does this itself)
const v3 = (a: readonly number[]) => new Vector3(a[0], a[1], a[2])
const rad = (deg: number) => (deg * Math.PI) / 180

// --- Engine (↔ three WebGLRenderer; 4th arg = use devicePixelRatio like setPixelRatio) ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const engine = new Engine(canvas, true, undefined, true)
const scene = new Scene(engine)
// Turning smoothness: Babylon picks meshes on EVERY pointer move by default; with thousands of block
// instances that stalls frames while you move the mouse. We never use hover picking (blocks use our raycast).
scene.skipPointerMovePicking = true
scene.useRightHandedSystem = true // match three's coordinate system
const ip = scene.imageProcessingConfiguration // ↔ renderer.toneMapping = ACESFilmic
ip.toneMappingEnabled = true
ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES

// --- Camera (UniversalCamera + enterPointerlock ↔ PerspectiveCamera + PointerLockControls). fov is vertical, radians. ---
const C = PARAMS.camera
const camera = new UniversalCamera('cam', v3(C.position), scene)
camera.setTarget(v3(C.target))
camera.inputs.removeByType('FreeCameraKeyboardMoveInput') // movement is our own WASD code (same as three)
// Mouse look is our own too: Babylon's mouse input goes through its movement/interaction system and felt
// jerky. Ours applies each pointer-lock mousemove to the rotation immediately (like three's PointerLockControls).
// Right-handed scene: Babylon's convention is yaw -= movementX, pitch -= movementY (pitch < 0 = look down).
camera.inputs.removeByType('FreeCameraMouseInput')
const PITCH_LIMIT = 1.5707
addEventListener('mousemove', (e) => {
  if (!engine.isPointerLock) return
  const s = C.lookSpeed * look
  camera.rotation.y -= e.movementX * s
  camera.rotation.x = Math.max(
    -PITCH_LIMIT,
    Math.min(PITCH_LIMIT, camera.rotation.x - e.movementY * s),
  )
})
// inertia 0: default 0.9 glides each mouse delta into a decaying velocity (≈10× total turn, keeps coasting).
// With 0, rotation = exactly lookSpeed rad/px and stops with the mouse (↔ three PointerLockControls).
camera.inertia = 0
camera.fov = rad(C.fovDeg)
camera.minZ = C.near
camera.maxZ = C.far
camera.attachControl(canvas, true)
canvas.addEventListener('click', () => engine.enterPointerlock())

// --- Sun direction: unit vector pointing TOWARD the sun. Same formula as three's setFromSphericalCoords. ---
const phi = rad(PARAMS.sun.polarDeg)
const theta = rad(PARAMS.sun.azimuthDeg)
const sunDir = new Vector3(
  Math.sin(phi) * Math.sin(theta),
  Math.cos(phi),
  Math.sin(phi) * Math.cos(theta),
)

// --- Sky (SkyMaterial ↔ three Sky addon; both Preetham model, same parameter names) ---
const skyMat = new SkyMaterial('skyMat', scene)
skyMat.backFaceCulling = false
skyMat.turbidity = PARAMS.sky.turbidity
skyMat.rayleigh = PARAMS.sky.rayleigh
skyMat.mieCoefficient = PARAMS.sky.mieCoefficient
skyMat.mieDirectionalG = PARAMS.sky.mieDirectionalG
skyMat.luminance = PARAMS.sky.luminance
skyMat.useSunPosition = true
skyMat.sunPosition = sunDir.scale(100)
const skybox = CreateBox('sky', { size: PARAMS.sky.size }, scene)
skybox.material = skyMat
skybox.infiniteDistance = true
skyMat.fogEnabled = false // fog is only for the cloud plane's far edge

// --- Clouds (bab-only): procedural texture rendered once, alpha-tested + slightly transparent, unlit, no shadows.
//     The plane follows the camera in x/z; the texture offset drifts so clouds move (texture wraps). ---
const CL = PARAMS.clouds
const cloudTex = new CloudProceduralTexture('cloudTex', CL.texSize, scene)
cloudTex.skyColor = new Color4(1, 1, 1, 0) // alpha 0 = clear sky, alpha 1 = cloud
cloudTex.cloudColor = new Color4(1, 1, 1, 1)
cloudTex.amplitude = CL.amplitude
cloudTex.numOctaves = CL.octaves
cloudTex.refreshRate = 0 // static noise: render once
cloudTex.updateSamplingMode(Texture.NEAREST_NEAREST)
cloudTex.hasAlpha = true
const cloudMat = new StandardMaterial('cloudMat', scene)
cloudMat.diffuseTexture = cloudTex
cloudMat.useAlphaFromDiffuseTexture = true
cloudMat.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND
cloudMat.alphaCutOff = CL.cutoff
cloudMat.alpha = CL.opacity
cloudMat.disableLighting = true
cloudMat.emissiveColor = Color3.White()
cloudMat.backFaceCulling = false // visible from above too (fly mode)
const clouds = CreatePlane('clouds', { size: CL.size }, scene)
clouds.rotation.x = Math.PI / 2 // lay flat
clouds.position.y = CL.height
clouds.material = cloudMat
clouds.isPickable = false
scene.fogMode = Scene.FOGMODE_LINEAR
scene.fogColor = lin(CL.fog)
scene.fogStart = CL.fogStart
scene.fogEnd = CL.fogEnd

// --- Lights ---
// HemisphericLight ↔ three HemisphereLight
const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)
hemi.diffuse = lin(PARAMS.hemi.sky)
hemi.groundColor = lin(PARAMS.hemi.ground)
hemi.intensity = PARAMS.hemi.intensity
// scene.ambientColor ↔ three AmbientLight (materials opt in via ambientColor = white)
scene.ambientColor = lin(PARAMS.ambient.color).scale(PARAMS.ambient.intensity)

// --- Day/night (bab-only): each frame move the sun along its arc and dim lights, clouds and fog with it. ---
const D = PARAMS.day
let dayTime = D.start // saved
const sunUp = new Vector3(0, 1, 0)
const sunAcross = new Vector3(Math.sin(theta), 0, Math.cos(theta)) // horizontal direction at azimuthDeg
const updateSun = (dt: number) => {
  const ff = keys.has('KeyT') ? D.fastForward : 1
  dayTime = (dayTime + (dt * ff) / D.length) % 1
  const a = 2 * Math.PI * (dayTime - 0.25) // 0 = sunrise, π/2 = noon
  sunAcross.scaleToRef(Math.cos(a), sunDir).addInPlace(sunUp.scale(Math.sin(a)))
  sun.direction = sunDir.negate()
  sun.position = sunDir.scale(S.distance)
  skyMat.sunPosition = sunDir.scale(100)
  const day = Math.min(1, Math.max(0, sunDir.y / D.twilight)) // 0 night … 1 day
  const dim = D.night + (1 - D.night) * day
  sun.intensity = S.intensity * day
  hemi.intensity = PARAMS.hemi.intensity * dim
  scene.ambientColor = lin(PARAMS.ambient.color).scale(
    PARAMS.ambient.intensity * dim,
  )
  cloudMat.emissiveColor.set(dim, dim, dim)
  scene.fogColor = lin(CL.fog).scale(dim)
}
// HUD clock: dayTime → "hh:mm" (0.5 = 12:00)
const clock = () => {
  const m = Math.floor(dayTime * 24 * 60)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
// DirectionalLight + ShadowGenerator ↔ three DirectionalLight with castShadow. Babylon direction = light travel.
const S = PARAMS.sun
const sun = new DirectionalLight('sun', sunDir.negate(), scene)
sun.position = sunDir.scale(S.distance)
sun.diffuse = lin(PARAMS.sun.color)
sun.intensity = S.intensity
const shadows = new ShadowGenerator(S.shadowMapSize, sun)
shadows.usePercentageCloserFiltering = true // ↔ three PCFShadowMap
shadows.filteringQuality = ShadowGenerator.QUALITY_HIGH
shadows.bias = S.shadowBias
shadows.normalBias = S.shadowNormalBias
// Fixed ortho box around the chunk (↔ three shadow.camera left/right/top/bottom/near/far)
const E = S.shadowExtent
sun.autoUpdateExtends = false
Object.assign(sun, {
  orthoLeft: -E,
  orthoRight: E,
  orthoTop: E,
  orthoBottom: -E,
})
sun.shadowMinZ = 0.5
sun.shadowMaxZ = S.shadowFar

// --- World generation (biome: forest-edge plains). IDENTICAL code in both apps; only rendering differs.
//     Terrain = fbm heightmap into a 3D grid; trees stamped on top; only blocks touching air are rendered. ---
type BlockType = 'grass' | 'dirt' | 'stone' | 'log' | 'leaves' | 'sand'
// grid id = index + 1; 0 = air. Append new types at the END so saved edits keep their ids.
const BLOCK_TYPES: BlockType[] = [
  'grass',
  'dirt',
  'stone',
  'log',
  'leaves',
  'sand',
]
const K = PARAMS.chunk
// World seed (bab-only): ⟲ New world stores a random one; none stored = the PARAMS seeds.
const SEED_KEY = 'super-craft-bab-001-seed'
let storedSeed: string | null = null
try {
  storedSeed = localStorage.getItem(SEED_KEY)
} catch {}
const seed = storedSeed ?? K.seed
const WORLD_TAG = `${seed}/${K.size}` // a save only loads into the world it was made in
const noise2D = createNoise2D(seedrandom(seed))
// fbm: `octaves` layers of simplex, each at lacunarity× frequency and persistence× amplitude. Result in [-1, 1].
const fbm = (x: number, z: number) => {
  let [sum, norm, amp, freq] = [0, 0, 1, K.noiseScale]
  for (let o = 0; o < K.octaves; o++) {
    sum += amp * noise2D(x * freq, z * freq)
    norm += amp
    amp *= K.persistence
    freq *= K.lacunarity
  }
  return sum / norm
}
const heights = Array.from({ length: K.size }, (_, x) =>
  Array.from({ length: K.size }, (_, z) =>
    Math.min(
      K.maxHeight,
      Math.floor(K.baseHeight + (K.amplitude * (fbm(x, z) + 1)) / 2),
    ),
  ),
)
// 3D grid, x fastest. Out-of-bounds reads are air; out-of-bounds writes are ignored.
const grid = new Uint8Array(K.size * K.size * K.maxHeight)
const inside = (x: number, y: number, z: number) =>
  x >= 0 && x < K.size && z >= 0 && z < K.size && y >= 0 && y < K.maxHeight
const idx = (x: number, y: number, z: number) => (y * K.size + z) * K.size + x
const get = (x: number, y: number, z: number) =>
  inside(x, y, z) ? grid[idx(x, y, z)] : 0
const set = (x: number, y: number, z: number, t: BlockType) => {
  if (inside(x, y, z)) grid[idx(x, y, z)] = BLOCK_TYPES.indexOf(t) + 1
}
for (let x = 0; x < K.size; x++)
  for (let z = 0; z < K.size; z++)
    for (let y = 0; y < heights[x][z]; y++) {
      const depth = heights[x][z] - 1 - y // 0 = top block
      const beach = heights[x][z] <= K.waterLevel + K.beach
      set(
        x,
        y,
        z,
        depth <= K.dirtDepth
          ? beach
            ? 'sand'
            : depth === 0
              ? 'grass'
              : 'dirt'
          : 'stone',
      )
    }
// Trees: scan x then z. RNG call order must match in both apps (trunk roll only when a tree is placed).
const TR = PARAMS.trees
const treeRng = seedrandom(storedSeed ? `${storedSeed}-trees` : TR.seed)
const trees: [number, number, number][] = [] // [x, groundY, z] = first trunk block
for (let x = TR.margin; x < K.size - TR.margin; x++)
  for (let z = TR.margin; z < K.size - TR.margin; z++) {
    if (treeRng() >= TR.chance) continue
    if (heights[x][z] <= K.waterLevel + K.beach) continue // no trees on sand / under water
    if (
      trees.some(
        ([tx, , tz]) =>
          Math.max(Math.abs(tx - x), Math.abs(tz - z)) < TR.minSpacing,
      )
    )
      continue
    const trunk =
      TR.minTrunk + Math.floor(treeRng() * (TR.maxTrunk - TR.minTrunk + 1))
    const y0 = heights[x][z]
    const top = y0 + trunk - 1
    trees.push([x, y0, z])
    set(x, y0 - 1, z, 'dirt') // no grass under a trunk
    // Canopy layers relative to trunk top: dy -1, 0 = radius 2; dy 1, 2 = radius 1. Corners cut except dy 1.
    for (let dy = -1; dy <= 2; dy++) {
      const r = dy <= 0 ? 2 : 1
      for (let dx = -r; dx <= r; dx++)
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && dy !== 1) continue
          if (get(x + dx, top + dy, z + dz) === 0)
            set(x + dx, top + dy, z + dz, 'leaves')
        }
    }
    for (let y = y0; y <= top; y++) set(x, y, z, 'log') // trunk last: overwrites canopy
  }
// Visible blocks per type: skip blocks fully enclosed. Below y=0 counts as solid (chunk bottom hidden).
const solid = (x: number, y: number, z: number) => y < 0 || get(x, y, z) !== 0
const NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
// Recomputed after every block edit (49k cells, a few ms).
const visibleBlocks = () => {
  const blocks = Object.fromEntries(
    BLOCK_TYPES.map((t) => [t, []]),
  ) as unknown as Record<BlockType, [number, number, number][]>
  for (let y = 0; y < K.maxHeight; y++)
    for (let z = 0; z < K.size; z++)
      for (let x = 0; x < K.size; x++) {
        const id = get(x, y, z)
        if (
          id === 0 ||
          NEIGHBORS.every(([dx, dy, dz]) => solid(x + dx, y + dy, z + dz))
        )
          continue
        // Chunk centered on the origin in x/z, sitting on y=0.
        blocks[BLOCK_TYPES[id - 1]].push([
          x - K.size / 2 + 0.5,
          y + 0.5,
          z - K.size / 2 + 0.5,
        ])
      }
  return blocks
}
const blocks = visibleBlocks()
// Parity fingerprint: both apps must log identical numbers.
console.log(
  'world',
  JSON.stringify({
    trees: trees.length,
    ...Object.fromEntries(BLOCK_TYPES.map((t) => [t, blocks[t].length])),
  }),
)

// --- Pixel textures (logic meant to be identical in both apps): one atlas canvas, tiles left → right:
//     0 grassTop, 1 grassSide, 2 dirt, 3 stone, 4 logSide, 5 logTop, 6 leaves, 7 sand. One seeded RNG, drawn in a fixed order. ---
const T = PARAMS.texture
const N = T.size
const TILES = [
  'grassTop',
  'grassSide',
  'dirt',
  'stone',
  'logSide',
  'logTop',
  'leaves',
  'sand',
  'tallGrass',
  'flower',
] as const
const rng = seedrandom(T.seed)
const noise4D = createNoise4D(rng)
// Seamless noise: x/y map onto two circles (a torus), so tiles repeat without seams. Result in [0, 1].
const tileNoise = (x: number, y: number, scale: number, offset: number) => {
  const r = (scale * N) / (2 * Math.PI)
  const [ax, ay] = [(2 * Math.PI * x) / N, (2 * Math.PI * y) / N]
  return (
    (noise4D(
      r * Math.cos(ax) + offset,
      r * Math.sin(ax),
      r * Math.cos(ay),
      r * Math.sin(ay),
    ) +
      1) /
    2
  )
}
// Pattern = palette index per pixel: clumps from noise, `grain` share of pure random.
const pattern = (
  t: { palette: readonly string[]; scale: number; grain: number },
  offset: number,
) =>
  Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => {
      const v =
        tileNoise(x, y, t.scale, offset) * (1 - t.grain) + rng() * t.grain
      return t.palette[
        Math.min(t.palette.length - 1, Math.floor(v * t.palette.length))
      ]
    }),
  )
const grassTop = pattern(T.grassTop, 0)
const dirt = pattern(T.dirt, 50)
const stone = pattern(T.stone, 100)
// Stone cracks: short random walks of dark pixels, mostly horizontal.
for (let i = 0; i < T.stone.cracks; i++) {
  let [x, y] = [Math.floor(rng() * N), Math.floor(rng() * N)]
  for (let step = 0, len = 3 + Math.floor(rng() * 4); step < len; step++) {
    stone[y][x] = T.stone.crack
    x = (x + 1) % N
    if (rng() < 0.35) y = (y + (rng() < 0.5 ? 1 : N - 1)) % N
  }
}
// Grass side: dirt, then per column a grass overhang of random depth with a darker bottom edge.
const GS = T.grassSide
const grassSide = dirt.map((row) => [...row])
for (let x = 0; x < N; x++) {
  const depth = GS.minRows + Math.floor(rng() * (GS.maxRows - GS.minRows + 1))
  for (let y = 0; y < depth; y++)
    grassSide[y][x] = y === depth - 1 ? GS.edge : grassTop[y][x]
}
// Log side: bark streaks. One palette value per column, mixed per pixel with `grain` random.
const LS = T.logSide
const logSide = Array.from({ length: N }, () => [] as string[])
for (let x = 0; x < N; x++) {
  const col = rng()
  for (let y = 0; y < N; y++) {
    const v = col * (1 - LS.grain) + rng() * LS.grain
    logSide[y][x] =
      LS.palette[
        Math.min(LS.palette.length - 1, Math.floor(v * LS.palette.length))
      ]
  }
}
// Log top/bottom: end grain. Square rings by distance from the center, outermost ring = bark rim.
const LT = T.logTop
const logTop = Array.from({ length: N }, (_, y) =>
  Array.from({ length: N }, (_, x) => {
    const ring = Math.floor(
      Math.max(Math.abs(x - (N - 1) / 2), Math.abs(y - (N - 1) / 2)),
    )
    return ring === N / 2 - 1 ? LT.rim : LT.rings[ring % LT.rings.length]
  }),
)
const leaves = pattern(T.leaves, 150)
const sand = pattern(T.sand, 200)
// Plant tiles (bab-only): transparent background ('' = clear pixel). Own RNG so the block tiles above don't change.
const PL = PARAMS.plants
const plantRng = seedrandom(`${T.seed}-plants`)
const clearTile = () =>
  Array.from({ length: N }, () => Array(N).fill('') as string[])
const tallGrass = clearTile()
for (let x = 0; x < N; x++) {
  if (plantRng() > PL.bladeDensity) continue
  const h = 4 + Math.floor(plantRng() * (N - 4))
  for (let y = N - h; y < N; y++)
    tallGrass[y][x] =
      T.grassTop.palette[Math.floor(plantRng() * T.grassTop.palette.length)]
}
const flower = clearTile()
for (let y = 7; y < N; y++) flower[y][7] = flower[y][8] = PL.stem
for (let y = 3; y < 7; y++) for (let x = 6; x < 10; x++) flower[y][x] = PL.petal
flower[4][7] = flower[4][8] = flower[5][7] = flower[5][8] = PL.center
// Paint all tiles into one atlas canvas (row 0 = top of the image).
const atlas = document.createElement('canvas')
atlas.width = N * TILES.length
atlas.height = N
const g = atlas.getContext('2d')!
;[
  grassTop,
  grassSide,
  dirt,
  stone,
  logSide,
  logTop,
  leaves,
  sand,
  tallGrass,
  flower,
].forEach((tile, i) =>
  tile.forEach((row, y) =>
    row.forEach((hex, x) => {
      if (!hex) return // transparent plant pixel
      g.fillStyle = hex
      g.fillRect(i * N + x, y, 1, 1)
    }),
  ),
)

// --- Hotbar UI (bab-only): bottom-center slots, one per BLOCK_TYPES entry, icon = its side tile from the atlas.
//     paintHotbar() re-marks the selected slot; showHud() calls it on every change. ---
const HOTBAR_ICON: Record<BlockType, (typeof TILES)[number]> = {
  grass: 'grassSide',
  dirt: 'dirt',
  stone: 'stone',
  log: 'logSide',
  leaves: 'leaves',
  sand: 'sand',
}
const hotbar = document.createElement('div')
hotbar.style.cssText =
  'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:4px;padding:4px;background:#0008;border-radius:6px;pointer-events:none'
const slots = BLOCK_TYPES.map((t, i) => {
  const slot = document.createElement('div')
  slot.style.cssText =
    'position:relative;width:44px;height:44px;border:3px solid #0000;border-radius:4px'
  const icon = document.createElement('canvas')
  icon.width = icon.height = N
  icon
    .getContext('2d')!
    .drawImage(atlas, TILES.indexOf(HOTBAR_ICON[t]) * N, 0, N, N, 0, 0, N, N)
  icon.style.cssText =
    'width:100%;height:100%;image-rendering:pixelated;display:block'
  const num = document.createElement('span')
  num.textContent = `${i + 1}`
  num.style.cssText =
    'position:absolute;left:2px;top:0;color:#fff;font:700 11px system-ui,sans-serif;text-shadow:0 0 2px #000'
  slot.append(icon, num)
  hotbar.append(slot)
  return slot
})
document.body.append(hotbar)
const paintHotbar = () =>
  slots.forEach(
    (s, i) =>
      (s.style.borderColor = BLOCK_TYPES[i] === selected ? '#fff' : '#0000'),
  )

// --- Material: one PBRMaterial with the atlas (↔ three MeshStandardMaterial).
//     DynamicTexture from a canvas; NEAREST_NEAREST = crisp pixels, no mipmaps (no atlas bleeding). ---
const atlasTex = new DynamicTexture(
  'atlas',
  atlas,
  scene,
  false,
  Texture.NEAREST_NEAREST,
)
atlasTex.update()
const blockMat = new PBRMaterial('blockMat', scene)
blockMat.albedoTexture = atlasTex // sRGB canvas; babylon treats albedo textures as sRGB
blockMat.roughness = PARAMS.blocks.roughness
blockMat.metallic = PARAMS.blocks.metalness
blockMat.ambientColor = Color3.White()

// --- Chunk rendering: one box per block type, faceUV picks atlas tiles, drawn via thin instances.
//     CreateBox face order: 0 +z, 1 -z, 2 +x, 3 -x, 4 top, 5 bottom. wrap: true = side images upright. ---
// Half-texel inset keeps edge samples inside the tile (no bleeding from neighbor tiles).
const uv = (tile: (typeof TILES)[number]) => {
  const i = TILES.indexOf(tile)
  const [du, dv] = [0.5 / atlas.width, 0.5 / atlas.height]
  return new Vector4(
    i / TILES.length + du,
    dv,
    (i + 1) / TILES.length - du,
    1 - dv,
  )
}
const FACE_TILES: Record<BlockType, (typeof TILES)[number][]> = {
  grass: [
    'grassSide',
    'grassSide',
    'grassSide',
    'grassSide',
    'grassTop',
    'dirt',
  ],
  dirt: Array(6).fill('dirt'),
  stone: Array(6).fill('stone'),
  log: ['logSide', 'logSide', 'logSide', 'logSide', 'logTop', 'logTop'],
  leaves: Array(6).fill('leaves'),
  sand: Array(6).fill('sand'),
}
// faceColors = per-face vertex colors, multiplied into albedo (same face order as faceUV).
const FS = PARAMS.faceShade
const faceColors = [FS.z, FS.z, FS.x, FS.x, FS.top, FS.bottom].map(
  (v) => new Color4(v, v, v, 1),
)
const meshes = {} as Record<BlockType, Mesh>
for (const [type, list] of Object.entries(blocks) as [
  BlockType,
  [number, number, number][],
][]) {
  const mesh = CreateBox(
    type,
    { size: 1, wrap: true, faceUV: FACE_TILES[type].map(uv), faceColors },
    scene,
  )
  mesh.material = blockMat
  meshes[type] = mesh
  mesh.receiveShadows = true
  shadows.addShadowCaster(mesh)
  setInstances(type, list)
}
// Replace a block type's thin instances with these positions (one 4x4 matrix each).
function setInstances(type: BlockType, list: [number, number, number][]) {
  const buf = new Float32Array(list.length * 16)
  list.forEach((p, i) => Matrix.Translation(...p).copyToArray(buf, i * 16))
  meshes[type].thinInstanceSetBuffer('matrix', buf, 16, false)
  meshes[type].isVisible = list.length > 0 // 0 instances would draw the bare box at the origin
}
// --- Water (bab-only): one translucent plane over the whole chunk at the water surface; terrain above it hides it. ---
const WA = K.water
const WATER_Y = K.waterLevel - 0.1 // a bit below the full block height so shorelines read
const water = CreatePlane('water', { size: K.size }, scene)
water.rotation.x = Math.PI / 2 // lay flat
water.position.y = WATER_Y
water.isPickable = false
const waterMat = new StandardMaterial('waterMat', scene)
waterMat.diffuseColor = Color3.FromHexString(WA.color)
waterMat.alpha = WA.alpha
waterMat.specularColor = new Color3(0.3, 0.3, 0.3)
waterMat.backFaceCulling = false // visible from below while swimming
water.material = waterMat
water.receiveShadows = true
// --- Plants (bab-only): seeded per grass column; drawn as two crossed double-sided planes (thin instances). ---
type Plant = 'tallGrass' | 'flower'
const plants = new Map<number, Plant>() // grid index of the plant's (air) cell → kind
{
  const rngP = seedrandom(`${seed}-plants`)
  const grassId = BLOCK_TYPES.indexOf('grass') + 1
  for (let x = 0; x < K.size; x++)
    for (let z = 0; z < K.size; z++) {
      const r = rngP()
      const y = heights[x][z]
      if (get(x, y - 1, z) !== grassId || get(x, y, z) !== 0) continue
      if (r < PL.flower) plants.set(idx(x, y, z), 'flower')
      else if (r < PL.flower + PL.grass) plants.set(idx(x, y, z), 'tallGrass')
    }
}
const plantMat = new PBRMaterial('plantMat', scene)
plantMat.albedoTexture = atlasTex
plantMat.useAlphaFromAlbedoTexture = true
plantMat.transparencyMode = Material.MATERIAL_ALPHATEST
plantMat.alphaCutOff = 0.5
plantMat.backFaceCulling = false
plantMat.roughness = 1
plantMat.metallic = 0
plantMat.ambientColor = Color3.White()
blockMat.transparencyMode = Material.MATERIAL_OPAQUE // atlas now has alpha (plants); blocks stay opaque
const plantMeshes = Object.fromEntries(
  (['tallGrass', 'flower'] as Plant[]).map((k) => {
    const m = CreatePlane(
      k,
      { size: 1, frontUVs: uv(k), backUVs: uv(k), sideOrientation: 2 },
      scene,
    ) // 2 = DOUBLESIDE
    m.material = plantMat
    m.receiveShadows = true
    m.isPickable = false
    return [k, m]
  }),
) as Record<Plant, Mesh>
const DIAG = [Matrix.RotationY(Math.PI / 4), Matrix.RotationY(-Math.PI / 4)]
const rebuildPlants = () => {
  const lists: Record<Plant, number[]> = { tallGrass: [], flower: [] }
  for (const [i, k] of plants) {
    const x = i % K.size
    const z = Math.floor(i / K.size) % K.size
    const y = Math.floor(i / (K.size * K.size))
    if (
      get(x, y, z) !== 0 ||
      get(x, y - 1, z) !== BLOCK_TYPES.indexOf('grass') + 1
    ) {
      plants.delete(i) // cell filled or grass gone: plant is gone for good
      continue
    }
    const t = Matrix.Translation(
      x - K.size / 2 + 0.5,
      y + 0.5,
      z - K.size / 2 + 0.5,
    )
    for (const r of DIAG) lists[k].push(...r.multiply(t).asArray())
  }
  for (const k of ['tallGrass', 'flower'] as Plant[]) {
    plantMeshes[k].thinInstanceSetBuffer(
      'matrix',
      new Float32Array(lists[k]),
      16,
      false,
    )
    plantMeshes[k].isVisible = lists[k].length > 0
  }
}
rebuildPlants()
const rebuildChunk = () => {
  const b = visibleBlocks()
  BLOCK_TYPES.forEach((t) => setInstances(t, b[t]))
  rebuildPlants()
}

// --- Fly movement (identical in both apps): WASD on the horizontal plane, Space up, Shift down, R reset.
//     fwd = camera look direction; returns the position delta for this frame. ---
const keys = new Set<string>()
// `tapped` keeps a key "down" until one frame has used it, so a quick tap (press+release between two
// frames) still moves you / starts a climb instead of being lost.
const tapped = new Set<string>()
addEventListener('keydown', (e) => (keys.add(e.code), tapped.add(e.code)))
addEventListener('keyup', (e) => keys.delete(e.code))
// R reset target (identical in both apps): stand ON THE GROUND inside the forest. Scan columns in rings out
// from the chunk center; take the first with 2 air blocks above its terrain (body fits) and a direction
// (-z, +x, +z, -x) with `clearView` air blocks ahead at eye level. Returns [x, y, z, lookDx, lookDz].
const centerEye = () => {
  const c = K.size / 2
  const DIRS = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]
  const fits = (x: number, z: number) =>
    heights[x][z] > K.waterLevel && // dry land only
    get(x, heights[x][z], z) === 0 &&
    get(x, heights[x][z] + 1, z) === 0
  const clear = (x: number, z: number, [dx, dz]: number[]) => {
    for (let s = 1; s <= C.clearView; s++)
      if (get(x + dx * s, heights[x][z] + 1, z + dz * s) !== 0) return false
    return true
  }
  for (let r = 0; r < K.size; r++)
    for (let x = c - r; x <= c + r; x++)
      for (let z = c - r; z <= c + r; z++) {
        if (!inside(x, 0, z) || !fits(x, z)) continue
        const dir = DIRS.find((d) => clear(x, z, d))
        if (dir)
          return [
            x - K.size / 2 + 0.5,
            heights[x][z] + C.eyeHeight,
            z - K.size / 2 + 0.5,
            dir[0],
            dir[1],
          ] as const
      }
  return [0, K.maxHeight, 0, 0, -1] as const // no spot found: above the chunk
}
// Mouse wheel = zoom: dolly along the view direction (identical in both apps). Returns blocks to move.
const wheelDistance = (e: WheelEvent) => -Math.sign(e.deltaY) * C.wheelStep
// --- Walk mode (bab-only for now): gravity, jump, AABB-vs-voxel collision. F toggles walk/fly. ---
// Own code instead of Babylon collisions: thin instances have no per-block colliders, and the grid lookup
// is a few lines. Each axis moves separately; if the body then overlaps a solid block, that axis is undone.
const W = PARAMS.walk
let mode: 'walk' | 'fly' = 'fly' // start in fly at the overview pose; R drops you into walk mode
let vy = 0 // vertical speed (walk mode), blocks/s
let onGround = false
let climbDir: [number, number] | null = null // go-to-top: push direction while a climb is running
let boost = 1 // speed multiplier from +/- keys
let look = 1 // turn-speed multiplier from [ / ] keys (mouse + arrows)
let selected: BlockType = PARAMS.edit.place // hotbar: block right click places (keys 1-6 = BLOCK_TYPES order)
// World coords → grid: block (gx, gy, gz) spans world [gx - size/2, +1) × [gy, +1) × [gz - size/2, +1).
const solidAt = (wx: number, wy: number, wz: number) => {
  const [gx, gy, gz] = [
    Math.floor(wx + K.size / 2),
    Math.floor(wy),
    Math.floor(wz + K.size / 2),
  ]
  // Block id (0 = air). Below y=0 counts as stone, but only under the chunk.
  return gy < 0
    ? inside(gx, 0, gz)
      ? BLOCK_TYPES.indexOf('stone') + 1
      : 0
    : get(gx, gy, gz)
}
// Does the body (feet at camera.y - eyeHeight) overlap any solid block?
let lastHit = [0, 0, 0]
const bodyHits = (p: Vector3) => {
  const e = 1e-3 // shrink so touching a face isn't counted as overlap
  const feet = p.y - C.eyeHeight
  for (
    let x = Math.floor(p.x - W.radius + e);
    x <= Math.floor(p.x + W.radius - e);
    x++
  )
    for (
      let y = Math.floor(feet + e);
      y <= Math.floor(feet + W.height - e);
      y++
    )
      for (
        let z = Math.floor(p.z - W.radius + e);
        z <= Math.floor(p.z + W.radius - e);
        z++
      ) {
        const id = solidAt(x + 0.5, y + 0.5, z + 0.5)
        if (id) {
          lastHit = [x, y, z] // world cell of the block we ran into
          return id
        }
      }
  return 0
}
// Move the camera by d with collision, in sub-steps ≤ 0.4 blocks so fast moves can't tunnel.
// Anti-stuck: a move is only undone if it CREATES an overlap (if you're already inside a block, e.g. after
// F from fly mode, you can walk out). Returns which axes were blocked.
const moveCollide = (d: readonly number[]) => {
  const blocked = [false, false, false]
  let wall: number[] | null = null // cell that blocked an x/z move
  const steps = Math.ceil(Math.max(...d.map(Math.abs)) / 0.4) || 1
  const p = camera.position
  for (let s = 0; s < steps; s++)
    for (const a of [0, 1, 2] as const) {
      const key = (['x', 'y', 'z'] as const)[a]
      const before = p[key]
      const wasInside = bodyHits(p)
      p[key] += d[a] / steps
      const hit = bodyHits(p)
      if (wasInside || !hit) continue
      p[key] = before
      blocked[a] = true
      if (a !== 1) wall = lastHit
    }
  return { blocked, wall }
}
const hud = document.createElement('div') // mode + key help under the app label
hud.style.cssText =
  'position:fixed;top:36px;left:8px;padding:2px 8px;background:#0008;color:#fff;font:12px system-ui,sans-serif;border-radius:4px;pointer-events:none'
document.body.append(hud)
const setMode = (m: typeof mode) => {
  mode = m
  vy = 0
  climbDir = null
  showHud()
}
const showHud = () => (
  paintHotbar(),
  (hud.textContent = `${mode} · place ${selected} (1-6) · speed ×${boost.toFixed(2)} (+/-) · turn ×${look.toFixed(2)} ([ ]) · LMB break · RMB place · arrows turn · F walk/fly · R reset · wheel zoom · WASD Space · Shift ${mode === 'fly' ? 'down' : 'sprint'}`)
)
setMode(mode)
// R = reset pose on the forest floor, in walk mode (↔ three position.set + lookAt)
const resetPose = () => {
  const [x, y, z, dx, dz] = centerEye()
  camera.position = new Vector3(x, y, z)
  camera.setTarget(new Vector3(x + dx, y, z + dz))
  setMode('walk')
}
// Wheel = zoom (dolly along the view direction); collides in walk mode. ↔ three getWorldDirection
addEventListener('wheel', (e) => {
  const d = camera
    .getTarget()
    .subtract(camera.position)
    .normalize()
    .scale(wheelDistance(e))
  if (mode === 'walk') moveCollide([d.x, d.y, d.z])
  else camera.position.addInPlace(d)
})
// --- Break / place blocks (while the mouse is captured): left click breaks the block under the crosshair,
// right click places the `selected` hotbar block on the face you're looking at. Ray in grid coords (x/z offset by size/2).
const aimed = () => {
  let cell: number[] | null = null
  const normal = [0, 0, 0]
  const p = camera.position
  const dir = camera.getTarget().subtract(p).normalize()
  const hit = raycast(
    (x, y, z) => {
      const id = get(x, y, z)
      if (id) cell = [x, y, z]
      return id
    },
    [p.x + K.size / 2, p.y, p.z + K.size / 2],
    [dir.x, dir.y, dir.z],
    PARAMS.edit.reach,
    [0, 0, 0],
    normal,
  )
  return hit && cell ? { cell: cell as number[], normal } : null
}
// Aim feedback: center crosshair (DOM) + black outline around the block a click would break (12 cube edges).
const crosshair = document.createElement('div')
crosshair.textContent = '+'
crosshair.style.cssText =
  'position:fixed;left:50%;top:50%;transform:translate(-50%,-52%);color:#fff;font:300 28px system-ui,sans-serif;text-shadow:0 0 2px #000;pointer-events:none'
document.body.append(crosshair)
const h = 0.502 // slightly bigger than a block so the lines don't z-fight its faces
const corner = (i: number) =>
  new Vector3(i & 1 ? h : -h, i & 2 ? h : -h, i & 4 ? h : -h)
// edges = corner pairs differing in exactly one bit
const EDGES = [0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) =>
  [1, 2, 4].filter((b) => !(i & b)).map((b) => [corner(i), corner(i | b)]),
)
const outline = CreateLineSystem('outline', { lines: EDGES }, scene)
outline.color = Color3.Black()
outline.isPickable = false
outline.isVisible = false
const showAim = (on: boolean) => {
  const a = on ? aimed() : null
  outline.isVisible = !!a
  crosshair.style.display = on ? '' : 'none'
  if (a) {
    const [x, y, z] = a.cell
    outline.position.set(x - K.size / 2 + 0.5, y + 0.5, z - K.size / 2 + 0.5)
  }
}
// Block-break burst: one short-lived ParticleSystem per break (disposes itself), texture = the block's icon tile.
const B = PARAMS.burst
const tileTex = {} as Record<BlockType, DynamicTexture>
const burst = (x: number, y: number, z: number, t: BlockType) => {
  if (!tileTex[t]) {
    const tex = new DynamicTexture(
      `burst-${t}`,
      { width: N, height: N },
      scene,
      false,
      Texture.NEAREST_NEAREST,
    )
    tex
      .getContext()
      .drawImage(atlas, TILES.indexOf(HOTBAR_ICON[t]) * N, 0, N, N, 0, 0, N, N)
    tex.update()
    tileTex[t] = tex
  }
  const ps = new ParticleSystem('burst', B.count, scene)
  ps.particleTexture = tileTex[t]
  ps.emitter = new Vector3(x - K.size / 2 + 0.5, y + 0.5, z - K.size / 2 + 0.5)
  ps.minEmitBox = new Vector3(-0.4, -0.4, -0.4)
  ps.maxEmitBox = new Vector3(0.4, 0.4, 0.4)
  ps.direction1 = new Vector3(-1, 1, -1)
  ps.direction2 = new Vector3(1, 2.5, 1)
  ps.gravity = new Vector3(0, -B.gravity, 0)
  ;[ps.minSize, ps.maxSize] = B.size
  ;[ps.minLifeTime, ps.maxLifeTime] = B.life
  ;[ps.minEmitPower, ps.maxEmitPower] = B.power
  ps.color1 = ps.color2 = new Color4(1, 1, 1, 1)
  ps.colorDead = new Color4(1, 1, 1, 0)
  ps.blendMode = ParticleSystem.BLENDMODE_STANDARD
  ps.manualEmitCount = B.count // emit all at once
  ps.targetStopDuration = 0.05 // stop emitting right away; live particles finish their life
  ps.onAnimationEnd = () => ps.dispose(false) // false = keep the shared tile texture (disposeOnStop would free it)
  ps.start()
}
const edits: Record<number, number> = {} // grid index → block id, saved so edits survive a refresh
const placeAt = (x: number, y: number, z: number, t: BlockType | null) => {
  if (!inside(x, y, z)) return
  const i = idx(x, y, z)
  grid[i] = edits[i] = t ? BLOCK_TYPES.indexOf(t) + 1 : 0
}
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
// pointerdown, not mousedown: Babylon preventDefaults pointerdown, which suppresses mousedown.
canvas.addEventListener('pointerdown', (e) => {
  if (!engine.isPointerLock && !freeMouse) return // first click only captures the mouse
  const a = aimed()
  if (!a) return
  const [x, y, z] = a.cell
  if (e.button === 0) {
    burst(x, y, z, BLOCK_TYPES[get(x, y, z) - 1])
    placeAt(x, y, z, null)
  } else if (e.button === 2) {
    const [nx, ny, nz] = [x + a.normal[0], y + a.normal[1], z + a.normal[2]]
    if (get(nx, ny, nz) !== 0) return
    placeAt(nx, ny, nz, selected)
    if (mode === 'walk' && bodyHits(camera.position))
      return placeAt(nx, ny, nz, null) // not inside yourself
  } else return
  rebuildChunk()
  save()
})
addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') resetPose()
  if (e.code === 'KeyF') setMode(mode === 'walk' ? 'fly' : 'walk')
  const step = { Equal: 1, NumpadAdd: 1, Minus: -1, NumpadSubtract: -1 }[e.code]
  if (step) {
    const [lo, hi] = C.boostRange
    boost = Math.min(hi, Math.max(lo, boost * C.boostStep ** step))
  }
  const lstep = { BracketRight: 1, BracketLeft: -1 }[e.code]
  if (lstep) {
    const [lo, hi] = C.lookRange
    look = Math.min(hi, Math.max(lo, look * C.lookStep ** lstep))
  }
  const slot = BLOCK_TYPES[+e.code.replace('Digit', '') - 1] // Digit1..Digit6
  if (slot) selected = slot
  if (step || lstep || slot) (showHud(), save())
})
const axis = (pos: string, neg: string) =>
  (keys.has(pos) || tapped.has(pos) ? 1 : 0) -
  (keys.has(neg) || tapped.has(neg) ? 1 : 0)
const moveDelta = (dt: number, fwd: { x: number; z: number }) => {
  const s = PARAMS.camera.moveSpeed * boost * dt
  const len = Math.hypot(fwd.x, fwd.z) || 1
  const [fx, fz] = [fwd.x / len, fwd.z / len] // right = (-fz, 0, fx)
  const f = axis('KeyW', 'KeyS')
  const r = axis('KeyD', 'KeyA')
  const u = axis('Space', 'ShiftLeft')
  return [(fx * f - fz * r) * s, u * s, (fz * f + fx * r) * s] as const
}
let last = performance.now()
const frameDt = () => {
  const now = performance.now()
  const dt = Math.min(0.1, (now - last) / 1000) // clamp after tab switches
  last = now
  return dt
}

// --- Resize + loop ---
window.addEventListener('resize', () => engine.resize())
// ?test (Claude's headless tests only): controls run without capturing the mouse; window.__bab exposes state.
const freeMouse = new URLSearchParams(location.search).has('test')
Object.assign(window, {
  __bab: {
    camera,
    state: () => ({
      onGround,
      climbDir,
      vy,
      mode,
      hit: bodyHits(camera.position),
    }),
  },
})
// Build stamp, set at build time: VITE_BUILD="<commit> <UTC time>" npx vite build (shows 'dev' locally).
const BUILD = `build ${import.meta.env.VITE_BUILD ?? 'dev'}`
const setText = (el: HTMLElement, t: string) =>
  el.textContent !== t && (el.textContent = t) // skip no-op DOM writes
const pos = document.createElement('div') // live position readout under the HUD (manual testing)
pos.style.cssText =
  'position:fixed;top:62px;left:8px;padding:2px 8px;background:#0008;color:#fff;font:12px ui-monospace,monospace;border-radius:4px;pointer-events:none'
document.body.append(pos)
engine.runRenderLoop(() => {
  const dt = frameDt()
  const fwd = camera.getTarget().subtract(camera.position)
  // HUD prompts to click while the mouse is free; all controls run only while captured (pointer lock).
  const locked = engine.isPointerLock || freeMouse
  const c = camera.position
  setText(
    pos,
    `${BUILD} · seed ${seed} · ${clock()} (T fast) · ${engine.getFps().toFixed(0)} fps  x ${c.x.toFixed(1)}  y ${(c.y - C.eyeHeight).toFixed(1)} (feet)  z ${c.z.toFixed(1)}${onGround ? '  ground' : ''}${climbDir ? '  climbing' : ''}`,
  )
  const bg = locked ? '#0008' : '#b00c'
  if (hud.style.background !== bg) hud.style.background = bg
  // Clouds: plane centered under the camera, texture slides by drift (u wraps every `size` blocks).
  clouds.position.x = c.x
  clouds.position.z = c.z
  cloudTex.uOffset =
    (((performance.now() / 1000) * CL.drift - c.x) / CL.size) % 1
  cloudTex.vOffset = (c.z / CL.size) % 1
  updateSun(dt)
  showAim(locked)
  if (!locked) {
    hud.textContent = 'Click the view to capture the mouse (Esc releases it)'
    scene.render()
    return
  }
  if (hud.textContent.startsWith('Click')) showHud()
  // Arrow keys rotate, same signs as the mouse: ← = +yaw, ↑ = +pitch (look up).
  const t = C.turnSpeed * look * dt
  camera.rotation.y += axis('ArrowLeft', 'ArrowRight') * t
  camera.rotation.x = Math.max(
    -1.55,
    Math.min(1.55, camera.rotation.x + axis('ArrowUp', 'ArrowDown') * t),
  )
  if (mode === 'fly') {
    camera.position.addInPlaceFromFloats(...moveDelta(dt, fwd))
  } else {
    // Walk: horizontal from WASD at walk speed, vertical from gravity/jump.
    const [dx, , dz] = moveDelta(dt, fwd)
    // wet = feet below the water surface: slower, sinks slowly, Space swims up (WA = PARAMS.chunk.water)
    const wet = camera.position.y - C.eyeHeight < WATER_Y
    const k =
      ((W.speed * (keys.has('ShiftLeft') ? W.sprint : 1)) /
        PARAMS.camera.moveSpeed) *
      (wet ? WA.speed : 1)
    const space = keys.has('Space') || tapped.has('Space')
    if (wet && space) vy = WA.swimSpeed
    else if (onGround && space) vy = W.jumpSpeed
    if (!climbDir) vy -= W.gravity * (wet ? WA.gravity : 1) * dt
    if (wet) vy = Math.max(vy, -WA.swimSpeed) // terminal sink speed
    const wasOnGround = onGround
    const { blocked, wall } = moveCollide([dx * k, vy * dt, dz * k])
    onGround = blocked[1] && vy < 0
    if (blocked[1]) vy = 0
    // Go-to-top: a push into a block from the ground starts a climb that FINISHES on its own (a tap of W
    // is enough): rise each frame until the body fits `W.climbNudge` further in the push direction, then
    // step onto the top. Stops early if the head hits something.
    if (wall && wasOnGround && !climbDir) {
      const len = Math.hypot(dx, dz) || 1
      climbDir = [dx / len, dz / len]
    }
    if (climbDir) {
      const p = camera.position
      vy = 0
      p.y += W.riseSpeed * dt
      if (bodyHits(p)) {
        p.y -= W.riseSpeed * dt // ceiling: give up
        climbDir = null
      } else {
        const [ux, uz] = climbDir
        p.x += ux * W.climbNudge
        p.z += uz * W.climbNudge
        if (bodyHits(p)) {
          p.x -= ux * W.climbNudge // not high enough yet: keep rising next frame
          p.z -= uz * W.climbNudge
        } else climbDir = null // over the edge: now standing on top
      }
    }
    if (camera.position.y < W.fallResetY) resetPose() // walked off the chunk edge
  }
  tapped.clear()
  scene.render()
})

// --- Save / load (this browser only, localStorage): block edits, pose, mode, speed and turn multipliers, hotbar block.
//     Saved on every edit/setting change, every 2 s, and when the page hides. All access in try/catch:
//     storage can be blocked (private window, previews) and the app must still run. ---
const SAVE_KEY = 'super-craft-bab-001'
function save() {
  try {
    const p = camera.position
    const r = camera.rotation
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        tag: WORLD_TAG,
        edits,
        pos: [p.x, p.y, p.z],
        rot: [r.x, r.y],
        mode,
        boost,
        look,
        selected,
        dayTime,
      }),
    )
  } catch {}
}
try {
  const d = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
  if (d?.tag === WORLD_TAG) {
    for (const [i, id] of Object.entries(d.edits as Record<string, number>))
      grid[+i] = edits[+i] = id
    if (Object.keys(d.edits).length) rebuildChunk()
    camera.position = new Vector3(...(d.pos as [number, number, number]))
    ;[camera.rotation.x, camera.rotation.y] = d.rot
    ;[boost, look] = [d.boost, d.look]
    if (BLOCK_TYPES.includes(d.selected)) selected = d.selected
    if (typeof d.dayTime === 'number') dayTime = d.dayTime
    setMode(d.mode)
  }
} catch {}
showHud()
setInterval(save, 2000)
addEventListener('pagehide', save)

// --- Top-right buttons: reload the page (keeps the save) and start a fresh world (clears it, new random seed). ---
const buttons = document.createElement('div')
buttons.style.cssText = 'position:fixed;top:8px;right:8px;display:flex;gap:6px'
const BUTTONS: [string, () => void][] = [
  ['↻ Reload', () => (save(), location.reload())],
  [
    '⟲ New world',
    () => {
      try {
        localStorage.removeItem(SAVE_KEY)
        localStorage.setItem(SEED_KEY, Math.random().toString(36).slice(2, 8))
      } catch {}
      removeEventListener('pagehide', save) // don't re-save the old world on the way out
      location.reload()
    },
  ],
]
for (const [label, onClick] of BUTTONS) {
  const b = document.createElement('button')
  b.textContent = label
  b.style.cssText =
    'padding:4px 10px;background:#000a;color:#fff;border:1px solid #fff4;border-radius:4px;font:600 13px system-ui,sans-serif;cursor:pointer'
  b.onclick = onClick
  buttons.append(b)
}
document.body.append(buttons)
