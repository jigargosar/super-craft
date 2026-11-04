// babylon-001 scene: one plains chunk (16x16 blocks) + sky + hemispheric/ambient/sun lights.
// PARITY: three-001/src/main.ts mirrors this file. The PARAMS block is identical in both;
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
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector'
import '@babylonjs/core/Meshes/thinInstanceMesh' // side-effect: enables thin instances
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial'
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

const lin = (hex: string) => Color3.FromHexString(hex).toLinearSpace() // sRGB hex → linear (three does this itself)
const v3 = (a: readonly number[]) => new Vector3(a[0], a[1], a[2])
const rad = (deg: number) => (deg * Math.PI) / 180

// --- Engine (↔ three WebGLRenderer; 4th arg = use devicePixelRatio like setPixelRatio) ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const engine = new Engine(canvas, true, undefined, true)
const scene = new Scene(engine)
scene.useRightHandedSystem = true // match three's coordinate system
const ip = scene.imageProcessingConfiguration // ↔ renderer.toneMapping = ACESFilmic
ip.toneMappingEnabled = true
ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES

// --- Camera (UniversalCamera + enterPointerlock ↔ PerspectiveCamera + PointerLockControls). fov is vertical, radians. ---
const C = PARAMS.camera
const camera = new UniversalCamera('cam', v3(C.position), scene)
camera.setTarget(v3(C.target))
camera.inputs.removeByType('FreeCameraKeyboardMoveInput') // movement is our own WASD code (same as three)
camera.angularSensibility = 1 / C.lookSpeed // babylon: rad/px = 1 / angularSensibility
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

// --- Lights ---
// HemisphericLight ↔ three HemisphereLight
const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)
hemi.diffuse = lin(PARAMS.hemi.sky)
hemi.groundColor = lin(PARAMS.hemi.ground)
hemi.intensity = PARAMS.hemi.intensity
// scene.ambientColor ↔ three AmbientLight (materials opt in via ambientColor = white)
scene.ambientColor = lin(PARAMS.ambient.color).scale(PARAMS.ambient.intensity)
// DirectionalLight + ShadowGenerator ↔ three DirectionalLight with castShadow. Babylon direction = light travel.
const sun = new DirectionalLight('sun', sunDir.negate(), scene)
sun.position = sunDir.scale(30)
sun.diffuse = lin(PARAMS.sun.color)
sun.intensity = PARAMS.sun.intensity
const S = PARAMS.sun
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
sun.shadowMaxZ = 60

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
// DynamicTexture ↔ three CanvasTexture. NEAREST_SAMPLINGMODE = nearest mag, mipmapped min.
const makeTexture = (type: BlockType) => {
  const t = new DynamicTexture(
    `${type}Tex`,
    makeTextureCanvas(type),
    scene,
    true,
    Texture.NEAREST_SAMPLINGMODE,
  )
  t.update()
  return t
}
// --- Materials (PBRMaterial ↔ MeshStandardMaterial; PBRMaterial chosen because it has ambientColor).
//     Texture carries the color (sRGB, babylon's default for albedo). ---
const pbr = (type: BlockType) => {
  const mat = new PBRMaterial(`${type}Mat`, scene)
  mat.albedoTexture = makeTexture(type)
  mat.roughness = PARAMS.blocks.roughness
  mat.metallic = PARAMS.blocks.metalness
  mat.ambientColor = Color3.White()
  return mat
}

// --- Chunk rendering: one box per block type drawn via thin instances (↔ three InstancedMesh) ---
for (const [type, list] of Object.entries(blocks) as [
  BlockType,
  [number, number, number][],
][]) {
  const mesh = CreateBox(type, { size: 1 }, scene)
  mesh.material = pbr(type)
  mesh.thinInstanceAdd(list.map((p) => Matrix.Translation(...p)))
  mesh.receiveShadows = true
  shadows.addShadowCaster(mesh)
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

// --- Resize + loop ---
window.addEventListener('resize', () => engine.resize())
engine.runRenderLoop(() => {
  const d = moveDelta(frameDt(), camera.getTarget().subtract(camera.position))
  if (engine.isPointerLock) camera.position.addInPlaceFromFloats(...d)
  scene.render()
})
