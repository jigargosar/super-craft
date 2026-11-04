// three-001 scene: one forest-edge plains chunk (32x32 blocks, trees) + sky + hemisphere/ambient/sun lights.
// PARITY: babylon-001/src/main.ts mirrors this file. PARAMS match except gaps listed in CLAUDE.md "Parity gaps";
// change a value in one, change it in the other. API pairs are noted per section.
// Renderer: WebGLRenderer (Sky addon is WebGL-only; WebGPU uses SkyMesh instead).
import './style.css'
import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { Sky } from 'three/addons/objects/Sky.js'
import { createNoise2D } from 'simplex-noise'
import seedrandom from 'seedrandom'

// --- PARAMS (keep identical in both apps) ---
const PARAMS = {
  camera: {
    fovDeg: 70,
    near: 0.1,
    far: 2000,
    position: [40, 34, 40],
    target: [0, 10, 0],
    lookSpeed: 0.002, // radians per mouse pixel (pointer lock)
    moveSpeed: 8, // blocks per second (WASD, Space up, Shift down)
  },
  sun: {
    polarDeg: 50,
    azimuthDeg: 30,
    color: '#ffffff',
    intensity: 2,
    shadowMapSize: 2048,
    shadowBias: 0.0005, // depth bias against shadow acne
    shadowNormalBias: 0.02, // offset along normals against acne on block faces
    shadowExtent: 26, // half-size of the shadow box around the chunk (blocks)
    distance: 60, // light placed at sunDir * distance
    shadowFar: 140, // shadow camera far plane
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
  // chunk: forest-edge plains. height = baseHeight + amplitude * (fbm + 1) / 2, fbm in [-1, 1]
  chunk: {
    size: 32,
    maxHeight: 48,
    seed: 'forest-plains-001',
    baseHeight: 2,
    amplitude: 20,
    noiseScale: 0.035,
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    dirtDepth: 3,
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
  // texture: pixel-art tiles. Each tile = base fill, then each pixel has `chance` to become a
  // random speckle color. grassSide = dirt tile with a `grassRows`-tall grass strip on top.
  texture: {
    size: 16,
    seed: 'tex-001',
    grassTop: {
      base: '#5c9e49',
      speckles: ['#4f8a3d', '#6bb057', '#457a34'],
      chance: 0.35,
    },
    dirt: {
      base: '#6b4a2c',
      speckles: ['#5c3f25', '#7c5636', '#4f3620'],
      chance: 0.35,
    },
    stone: {
      base: '#8a8a8a',
      speckles: ['#7a7a7a', '#969696', '#6f6f6f'],
      chance: 0.35,
    },
    grassSide: {
      base: '#7a5636',
      speckle: '#6b4a2c',
      grass: '#4f8a3d',
      grassSpeckle: '#5c9e49',
      grassRows: 4,
      chance: 0.3,
    },
    // logSide: bark. Each column becomes a random `streaks` color with `streakChance` (vertical streaks),
    // then speckles from `streaks`. logTop: end grain = square rings alternating `rings`, 1px `bark` rim.
    logSide: {
      base: '#6b4f2e',
      streaks: ['#584026', '#7d5c36'],
      streakChance: 0.5,
      chance: 0.15,
    },
    logTop: {
      rings: ['#a07a4a', '#8a6638'],
      bark: '#6b4f2e',
      chance: 0.1,
    },
    leaves: {
      base: '#3f7a2a',
      speckles: ['#356b23', '#4c8c34', '#2c5c1d'],
      chance: 0.4,
    },
  },
} as const

// --- Renderer (↔ babylon Engine + imageProcessingConfiguration ACES) ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap // soft PCF (PCFSoftShadowMap was removed) ↔ babylon PCF
renderer.toneMapping = THREE.ACESFilmicToneMapping

// --- Scene / camera (PerspectiveCamera + PointerLockControls ↔ UniversalCamera + enterPointerlock) ---
const scene = new THREE.Scene()
const C = PARAMS.camera
const camera = new THREE.PerspectiveCamera(
  C.fovDeg,
  window.innerWidth / window.innerHeight,
  C.near,
  C.far,
)
camera.position.set(...C.position)
camera.lookAt(...C.target)
const controls = new PointerLockControls(camera, document.body)
controls.pointerSpeed = C.lookSpeed / 0.002 // three's built-in sensitivity is 0.002 rad/px
canvas.addEventListener('click', () => controls.lock())

// --- Sun direction: unit vector pointing TOWARD the sun (shared by sky + light) ---
const sunDir = new THREE.Vector3().setFromSphericalCoords(
  1,
  THREE.MathUtils.degToRad(PARAMS.sun.polarDeg),
  THREE.MathUtils.degToRad(PARAMS.sun.azimuthDeg),
)

// --- Sky (Sky addon ↔ SkyMaterial; both Preetham model, same parameter names) ---
const sky = new Sky()
sky.scale.setScalar(PARAMS.sky.size)
const u = sky.material.uniforms
u.turbidity.value = PARAMS.sky.turbidity
u.rayleigh.value = PARAMS.sky.rayleigh
u.mieCoefficient.value = PARAMS.sky.mieCoefficient
u.mieDirectionalG.value = PARAMS.sky.mieDirectionalG
u.sunPosition.value.copy(sunDir)
scene.add(sky)

// --- Lights (HemisphereLight ↔ HemisphericLight, AmbientLight ↔ scene.ambientColor,
//     DirectionalLight ↔ DirectionalLight + ShadowGenerator) ---
scene.add(
  new THREE.HemisphereLight(
    PARAMS.hemi.sky,
    PARAMS.hemi.ground,
    PARAMS.hemi.intensity,
  ),
)
scene.add(
  new THREE.AmbientLight(PARAMS.ambient.color, PARAMS.ambient.intensity),
)
const sun = new THREE.DirectionalLight(PARAMS.sun.color, PARAMS.sun.intensity)
sun.position.copy(sunDir).multiplyScalar(PARAMS.sun.distance)
sun.castShadow = true
const S = PARAMS.sun
sun.shadow.mapSize.set(S.shadowMapSize, S.shadowMapSize)
sun.shadow.bias = -S.shadowBias // three: negative bias pushes depth away
sun.shadow.normalBias = S.shadowNormalBias
const E = S.shadowExtent // tight ortho box around the chunk = sharper shadows
Object.assign(sun.shadow.camera, {
  left: -E,
  right: E,
  top: E,
  bottom: -E,
  near: 0.5,
  far: S.shadowFar,
})
scene.add(sun)

// --- World generation (biome: forest-edge plains). IDENTICAL code in both apps; only rendering differs.
//     Terrain = fbm heightmap into a 3D grid; trees stamped on top; only blocks touching air are rendered. ---
type BlockType = 'grass' | 'dirt' | 'stone' | 'log' | 'leaves'
const BLOCK_TYPES: BlockType[] = ['grass', 'dirt', 'stone', 'log', 'leaves'] // grid id = index + 1; 0 = air
const K = PARAMS.chunk
const noise2D = createNoise2D(seedrandom(K.seed))
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
      set(
        x,
        y,
        z,
        depth === 0 ? 'grass' : depth <= K.dirtDepth ? 'dirt' : 'stone',
      )
    }
// Trees: scan x then z. RNG call order must match in both apps (trunk roll only when a tree is placed).
const TR = PARAMS.trees
const treeRng = seedrandom(TR.seed)
const trees: [number, number, number][] = [] // [x, groundY, z] = first trunk block
for (let x = TR.margin; x < K.size - TR.margin; x++)
  for (let z = TR.margin; z < K.size - TR.margin; z++) {
    if (treeRng() >= TR.chance) continue
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
// Parity fingerprint: both apps must log identical numbers.
console.log(
  'world',
  JSON.stringify({
    trees: trees.length,
    ...Object.fromEntries(BLOCK_TYPES.map((t) => [t, blocks[t].length])),
  }),
)

// --- Pixel textures (identical logic in both apps; one seeded RNG, tiles drawn in a fixed order) ---
const T = PARAMS.texture
const rng = seedrandom(T.seed)
// Fill a size x size canvas with `base(y, x)` per pixel, then speckle pixels: speckleAt(y) picks the color.
const drawTile = (
  base: (y: number, x: number) => string,
  chance: number,
  speckleAt: (y: number) => string,
) => {
  const c = document.createElement('canvas')
  c.width = c.height = T.size
  const g = c.getContext('2d')!
  for (let y = 0; y < T.size; y++)
    for (let x = 0; x < T.size; x++) {
      g.fillStyle = base(y, x)
      g.fillRect(x, y, 1, 1)
    }
  for (let x = 0; x < T.size; x++)
    for (let y = 0; y < T.size; y++)
      if (rng() < chance) {
        g.fillStyle = speckleAt(y)
        g.fillRect(x, y, 1, 1)
      }
  return c
}
const pick = (list: readonly string[]) => () =>
  list[Math.floor(rng() * list.length)]
const plain = (t: {
  base: string
  speckles: readonly string[]
  chance: number
}) => drawTile(() => t.base, t.chance, pick(t.speckles))
const GS = T.grassSide
const LS = T.logSide
const LT = T.logTop
// Bark streak color per column (drawn after the existing tiles so their RNG sequence is unchanged).
const barkColumns = () =>
  Array.from({ length: T.size }, () =>
    rng() < LS.streakChance ? pick(LS.streaks)() : LS.base,
  )
// End-grain ring index: Chebyshev distance from the tile center (0 = center, size/2 - 1 = rim).
const ring = (y: number, x: number) =>
  Math.floor(
    Math.max(Math.abs(x + 0.5 - T.size / 2), Math.abs(y + 0.5 - T.size / 2)),
  )
const tiles = {
  grassTop: plain(T.grassTop),
  dirt: plain(T.dirt),
  stone: plain(T.stone),
  grassSide: drawTile(
    (y) => (y < GS.grassRows ? GS.grass : GS.base),
    GS.chance,
    (y) => (y < GS.grassRows ? GS.grassSpeckle : GS.speckle),
  ),
  logSide: ((cols) =>
    drawTile((_y, x) => cols[x], LS.chance, pick(LS.streaks)))(barkColumns()),
  logTop: drawTile(
    (y, x) =>
      ring(y, x) === T.size / 2 - 1 ? LT.bark : LT.rings[ring(y, x) % 2],
    LT.chance,
    pick(LT.rings),
  ),
  leaves: plain(T.leaves),
}

// --- Materials (MeshStandardMaterial ↔ PBRMaterial): one per tile; texture carries the color.
//     CanvasTexture ↔ babylon DynamicTexture; nearest filtering = crisp pixels. ---
const material = (canvas: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = t.minFilter = THREE.NearestFilter
  return new THREE.MeshStandardMaterial({
    map: t,
    roughness: PARAMS.blocks.roughness,
    metalness: PARAMS.blocks.metalness,
  })
}
const mat = {
  grassTop: material(tiles.grassTop),
  grassSide: material(tiles.grassSide),
  dirt: material(tiles.dirt),
  stone: material(tiles.stone),
  logSide: material(tiles.logSide),
  logTop: material(tiles.logTop),
  leaves: material(tiles.leaves),
}
// BoxGeometry face order: +x, -x, +y (top), -y (bottom), +z, -z
const faces: Record<BlockType, THREE.Material[]> = {
  grass: [
    mat.grassSide,
    mat.grassSide,
    mat.grassTop,
    mat.dirt,
    mat.grassSide,
    mat.grassSide,
  ],
  dirt: Array(6).fill(mat.dirt),
  stone: Array(6).fill(mat.stone),
  log: [
    mat.logSide,
    mat.logSide,
    mat.logTop,
    mat.logTop,
    mat.logSide,
    mat.logSide,
  ],
  leaves: Array(6).fill(mat.leaves),
}

// --- Chunk rendering: one InstancedMesh per block type (↔ babylon thin instances) ---
const box = new THREE.BoxGeometry(1, 1, 1)
const m4 = new THREE.Matrix4()
for (const [type, list] of Object.entries(blocks) as [
  BlockType,
  [number, number, number][],
][]) {
  const mesh = new THREE.InstancedMesh(box, faces[type], list.length)
  list.forEach((p, i) => mesh.setMatrixAt(i, m4.makeTranslation(...p)))
  mesh.castShadow = mesh.receiveShadow = true
  scene.add(mesh)
}

// --- Fly movement (identical in both apps): WASD on the horizontal plane, Space up, Shift down, R reset.
//     fwd = camera look direction; returns the position delta for this frame. ---
const keys = new Set<string>()
addEventListener('keydown', (e) => keys.add(e.code))
addEventListener('keyup', (e) => keys.delete(e.code))
// R = reset pose to PARAMS.camera position/target (↔ babylon position + setTarget)
const resetPose = () => {
  camera.position.set(...C.position)
  camera.lookAt(...C.target)
}
addEventListener('keydown', (e) => e.code === 'KeyR' && resetPose())
const axis = (pos: string, neg: string) =>
  (keys.has(pos) ? 1 : 0) - (keys.has(neg) ? 1 : 0)
const moveDelta = (dt: number, fwd: { x: number; z: number }) => {
  const s = PARAMS.camera.moveSpeed * dt
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
const look = new THREE.Vector3()

// --- Resize + loop ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
renderer.setAnimationLoop(() => {
  const d = moveDelta(frameDt(), camera.getWorldDirection(look))
  if (controls.isLocked) camera.position.add(look.set(...d))
  renderer.render(scene, camera)
})
