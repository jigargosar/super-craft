// three-001 scene: one plains chunk (16x16 blocks) + sky + hemisphere/ambient/sun lights.
// PARITY: babylon-001/src/main.ts mirrors this file. The PARAMS block is identical in both;
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
    colors: { grass: '#5b8c3a', dirt: '#8b5a2b', stone: '#7f7f7f' },
  },
  // texture: pixel-art block textures; each pixel = block color * (1 ± jitter), seeded
  texture: { size: 16, seed: 'tex-001', jitter: 0.15 },
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
type BlockType = keyof typeof PARAMS.blocks.colors
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

// --- Pixel textures (identical in both apps): size x size canvas per block type,
//     each pixel = block color with seeded brightness jitter. Sampled with nearest filtering. ---
const makeTextureCanvas = (type: BlockType) => {
  const T = PARAMS.texture
  const c = document.createElement('canvas')
  c.width = c.height = T.size
  const g = c.getContext('2d')!
  const rng = seedrandom(`${T.seed}-${type}`)
  const hex = PARAMS.blocks.colors[type]
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  for (let y = 0; y < T.size; y++)
    for (let x = 0; x < T.size; x++) {
      const k = 1 + (rng() * 2 - 1) * T.jitter
      g.fillStyle = `rgb(${rgb.map((v) => Math.min(255, v * k)).join(',')})`
      g.fillRect(x, y, 1, 1)
    }
  return c
}
// CanvasTexture ↔ babylon DynamicTexture. Nearest mag filter = crisp pixels.
const makeTexture = (type: BlockType) => {
  const t = new THREE.CanvasTexture(makeTextureCanvas(type))
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.NearestMipmapLinearFilter // ↔ babylon NEAREST_SAMPLINGMODE
  return t
}
// --- Materials (MeshStandardMaterial ↔ PBRMaterial): texture carries the color. ---
const pbr = (type: BlockType) =>
  new THREE.MeshStandardMaterial({
    map: makeTexture(type),
    roughness: PARAMS.blocks.roughness,
    metalness: PARAMS.blocks.metalness,
  })

// --- Chunk rendering: one InstancedMesh per block type (↔ babylon thin instances) ---
const box = new THREE.BoxGeometry(1, 1, 1)
const m4 = new THREE.Matrix4()
for (const [type, list] of Object.entries(blocks) as [
  BlockType,
  [number, number, number][],
][]) {
  const mesh = new THREE.InstancedMesh(box, pbr(type), list.length)
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
