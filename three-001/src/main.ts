// three-001 scene: one plains chunk (16x16 blocks) + sky + hemisphere/ambient/sun lights.
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
    position: [18, 16, 18],
    target: [0, 4, 0],
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
    shadowExtent: 12, // half-size of the shadow box around the chunk (blocks)
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
  // chunk: plains biome heightmap. height = baseHeight + amplitude * (noise + 1), noise in [-1, 1]
  chunk: {
    size: 16,
    maxHeight: 32,
    seed: 'plains-001',
    baseHeight: 3,
    amplitude: 3,
    noiseScale: 0.06,
    dirtDepth: 3,
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
sun.position.copy(sunDir).multiplyScalar(30)
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
  far: 60,
})
scene.add(sun)

// --- Chunk generation (plains). Identical code in both apps; only rendering differs. ---
// Heightmap from seeded 2D simplex noise. Only blocks touching air are kept (hidden ones skipped).
type BlockType = 'grass' | 'dirt' | 'stone'
const K = PARAMS.chunk
const noise2D = createNoise2D(seedrandom(K.seed))
const heights = Array.from({ length: K.size }, (_, x) =>
  Array.from({ length: K.size }, (_, z) =>
    Math.min(
      K.maxHeight,
      Math.floor(
        K.baseHeight +
          K.amplitude * (noise2D(x * K.noiseScale, z * K.noiseScale) + 1),
      ),
    ),
  ),
)
// Solid if inside the heightmap. Below y=0 counts as solid so the chunk bottom is hidden; outside x/z is air.
const solid = (x: number, y: number, z: number) =>
  y < 0 || (x >= 0 && x < K.size && z >= 0 && z < K.size && y < heights[x][z])
const NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
// Block centers per type, chunk centered on the origin in x/z, sitting on y=0.
const blocks: Record<BlockType, [number, number, number][]> = {
  grass: [],
  dirt: [],
  stone: [],
}
for (let x = 0; x < K.size; x++)
  for (let z = 0; z < K.size; z++)
    for (let y = 0; y < heights[x][z]; y++) {
      if (NEIGHBORS.every(([dx, dy, dz]) => solid(x + dx, y + dy, z + dz)))
        continue
      const depth = heights[x][z] - 1 - y // 0 = top block
      const type: BlockType =
        depth === 0 ? 'grass' : depth <= K.dirtDepth ? 'dirt' : 'stone'
      blocks[type].push([x - K.size / 2 + 0.5, y + 0.5, z - K.size / 2 + 0.5])
    }

// --- Pixel textures (identical logic in both apps; one seeded RNG, tiles drawn in a fixed order) ---
const T = PARAMS.texture
const rng = seedrandom(T.seed)
// Fill a size x size canvas with `base`, then speckle pixels: speckleAt(y) picks the color per row.
const drawTile = (
  base: (y: number) => string,
  chance: number,
  speckleAt: (y: number) => string,
) => {
  const c = document.createElement('canvas')
  c.width = c.height = T.size
  const g = c.getContext('2d')!
  for (let y = 0; y < T.size; y++) {
    g.fillStyle = base(y)
    g.fillRect(0, y, T.size, 1)
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
const tiles = {
  grassTop: plain(T.grassTop),
  dirt: plain(T.dirt),
  stone: plain(T.stone),
  grassSide: drawTile(
    (y) => (y < GS.grassRows ? GS.grass : GS.base),
    GS.chance,
    (y) => (y < GS.grassRows ? GS.grassSpeckle : GS.speckle),
  ),
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

// --- Fly movement (identical in both apps): WASD on the horizontal plane, Space up, Shift down.
//     fwd = camera look direction; returns the position delta for this frame. ---
const keys = new Set<string>()
addEventListener('keydown', (e) => keys.add(e.code))
addEventListener('keyup', (e) => keys.delete(e.code))
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
