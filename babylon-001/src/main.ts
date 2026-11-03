// babylon-001 starter scene: floor + sky + cube + hemispheric/ambient/sun lights.
// PARITY: three-001/src/main.ts mirrors this file. The PARAMS block is identical in both;
// change a value in one, change it in the other. API pairs are noted per section.
// Gotchas vs three: (1) right-handed system turned on so coordinates match three;
// (2) PBR needs linear colors, so every hex goes through lin(); (3) no AmbientLight class,
// ambient = scene.ambientColor × material.ambientColor.
import './style.css'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator'
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent' // side-effect: enables shadows
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial'
import { ImageProcessingConfiguration } from '@babylonjs/core/Materials/imageProcessingConfiguration'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial'

// --- PARAMS (keep identical in both apps) ---
const PARAMS = {
  camera: { fovDeg: 70, near: 0.1, far: 2000, position: [6, 5, 8], target: [0, 0.5, 0] },
  sun: { polarDeg: 50, azimuthDeg: 30, color: '#ffffff', intensity: 2, shadowMapSize: 2048 },
  hemi: { sky: '#bfd8ff', ground: '#6b5a3a', intensity: 0.8 },
  ambient: { color: '#ffffff', intensity: 0.2 },
  sky: { size: 1000, turbidity: 2, rayleigh: 1, mieCoefficient: 0.005, mieDirectionalG: 0.8 },
  floor: { size: 64, color: '#5b8c3a', roughness: 1, metalness: 0 },
  cube: { size: 1, color: '#8b5a2b', roughness: 1, metalness: 0 },
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

// --- Camera (ArcRotateCamera ↔ PerspectiveCamera + OrbitControls). fov is vertical, radians. ---
const C = PARAMS.camera
const camera = new ArcRotateCamera('cam', 0, 1, 10, v3(C.target), scene)
camera.fov = rad(C.fovDeg)
camera.minZ = C.near
camera.maxZ = C.far
camera.setPosition(v3(C.position))
camera.attachControl(canvas, true)

// --- Sun direction: unit vector pointing TOWARD the sun. Same formula as three's setFromSphericalCoords. ---
const phi = rad(PARAMS.sun.polarDeg)
const theta = rad(PARAMS.sun.azimuthDeg)
const sunDir = new Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta))

// --- Sky (SkyMaterial ↔ three Sky addon; both Preetham model, same parameter names) ---
const skyMat = new SkyMaterial('skyMat', scene)
skyMat.backFaceCulling = false
skyMat.turbidity = PARAMS.sky.turbidity
skyMat.rayleigh = PARAMS.sky.rayleigh
skyMat.mieCoefficient = PARAMS.sky.mieCoefficient
skyMat.mieDirectionalG = PARAMS.sky.mieDirectionalG
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
const shadows = new ShadowGenerator(PARAMS.sun.shadowMapSize, sun)
shadows.usePercentageCloserFiltering = true

// --- Materials (PBRMaterial ↔ MeshStandardMaterial; PBRMaterial chosen because it has ambientColor) ---
const pbr = (name: string, m: { color: string; roughness: number; metalness: number }) => {
  const mat = new PBRMaterial(name, scene)
  mat.albedoColor = lin(m.color)
  mat.roughness = m.roughness
  mat.metallic = m.metalness
  mat.ambientColor = Color3.White()
  return mat
}

// --- Floor ---
const ground = CreateGround('floor', { width: PARAMS.floor.size, height: PARAMS.floor.size }, scene)
ground.material = pbr('floorMat', PARAMS.floor)
ground.receiveShadows = true

// --- Cube (1x1x1 block sitting on the floor) ---
const cube = CreateBox('cube', { size: PARAMS.cube.size }, scene)
cube.position.y = PARAMS.cube.size / 2
cube.material = pbr('cubeMat', PARAMS.cube)
shadows.addShadowCaster(cube)

// --- Resize + loop ---
window.addEventListener('resize', () => engine.resize())
engine.runRenderLoop(() => scene.render())
