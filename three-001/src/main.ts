// three-001 scene: one plains chunk (16x16 blocks) + sky + hemisphere/ambient/sun lights.
// PARITY: babylon-001/src/main.ts mirrors this file. The PARAMS block is identical in both;
// change a value in one, change it in the other. API pairs are noted per section.
// Renderer: WebGLRenderer (Sky addon is WebGL-only; WebGPU uses SkyMesh instead).
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
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
  },
  sun: {
    polarDeg: 50,
    azimuthDeg: 30,
    color: '#ffffff',
    intensity: 2,
    shadowMapSize: 2048,
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
} as const

// --- Renderer (↔ babylon Engine + imageProcessingConfiguration ACES) ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping

// --- Scene / camera (PerspectiveCamera + OrbitControls ↔ ArcRotateCamera) ---
const scene = new THREE.Scene()
const C = PARAMS.camera
const camera = new THREE.PerspectiveCamera(
  C.fovDeg,
  window.innerWidth / window.innerHeight,
  C.near,
  C.far,
)
camera.position.set(...C.position)
const controls = new OrbitControls(camera, canvas)
controls.target.set(...C.target)

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
sun.shadow.mapSize.set(PARAMS.sun.shadowMapSize, PARAMS.sun.shadowMapSize)
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 })
scene.add(sun)

// --- Materials (MeshStandardMaterial ↔ PBRMaterial). Three converts hex sRGB → linear itself. ---
const pbr = (m: { color: string; roughness: number; metalness: number }) =>
  new THREE.MeshStandardMaterial({
    color: m.color,
    roughness: m.roughness,
    metalness: m.metalness,
  })

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

// --- Chunk rendering: one InstancedMesh per block type (↔ babylon thin instances) ---
const box = new THREE.BoxGeometry(1, 1, 1)
const m4 = new THREE.Matrix4()
for (const [type, list] of Object.entries(blocks) as [
  BlockType,
  [number, number, number][],
][]) {
  const B = PARAMS.blocks
  const mesh = new THREE.InstancedMesh(
    box,
    pbr({ ...B, color: B.colors[type] }),
    list.length,
  )
  list.forEach((p, i) => mesh.setMatrixAt(i, m4.makeTranslation(...p)))
  mesh.castShadow = mesh.receiveShadow = true
  scene.add(mesh)
}

// --- Resize + loop ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
