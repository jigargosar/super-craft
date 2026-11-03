// three-001 starter scene: floor + sky + cube + hemisphere/ambient/sun lights.
// PARITY: babylon-001/src/main.ts mirrors this file. The PARAMS block is identical in both;
// change a value in one, change it in the other. API pairs are noted per section.
// Renderer: WebGLRenderer (Sky addon is WebGL-only; WebGPU uses SkyMesh instead).
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Sky } from 'three/addons/objects/Sky.js'

// --- PARAMS (keep identical in both apps) ---
const PARAMS = {
  camera: { fovDeg: 70, near: 0.1, far: 2000, position: [6, 5, 8], target: [0, 0.5, 0] },
  sun: { polarDeg: 50, azimuthDeg: 30, color: '#ffffff', intensity: 2, shadowMapSize: 2048 },
  hemi: { sky: '#bfd8ff', ground: '#6b5a3a', intensity: 0.8 },
  ambient: { color: '#ffffff', intensity: 0.2 },
  // luminance: babylon-only (its sky has built-in tone mapping; 0.6 matches three's ACES look)
  sky: { size: 1000, turbidity: 2, rayleigh: 1, mieCoefficient: 0.005, mieDirectionalG: 0.8, luminance: 0.6 },
  floor: { size: 64, color: '#5b8c3a', roughness: 1, metalness: 0 },
  cube: { size: 1, color: '#8b5a2b', roughness: 1, metalness: 0 },
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
const camera = new THREE.PerspectiveCamera(C.fovDeg, window.innerWidth / window.innerHeight, C.near, C.far)
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
scene.add(new THREE.HemisphereLight(PARAMS.hemi.sky, PARAMS.hemi.ground, PARAMS.hemi.intensity))
scene.add(new THREE.AmbientLight(PARAMS.ambient.color, PARAMS.ambient.intensity))
const sun = new THREE.DirectionalLight(PARAMS.sun.color, PARAMS.sun.intensity)
sun.position.copy(sunDir).multiplyScalar(30)
sun.castShadow = true
sun.shadow.mapSize.set(PARAMS.sun.shadowMapSize, PARAMS.sun.shadowMapSize)
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 })
scene.add(sun)

// --- Materials (MeshStandardMaterial ↔ PBRMaterial). Three converts hex sRGB → linear itself. ---
const pbr = (m: { color: string; roughness: number; metalness: number }) =>
  new THREE.MeshStandardMaterial({ color: m.color, roughness: m.roughness, metalness: m.metalness })

// --- Floor ---
const floor = new THREE.Mesh(new THREE.PlaneGeometry(PARAMS.floor.size, PARAMS.floor.size), pbr(PARAMS.floor))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// --- Cube (1x1x1 block sitting on the floor) ---
const s = PARAMS.cube.size
const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), pbr(PARAMS.cube))
cube.position.y = s / 2
cube.castShadow = true
scene.add(cube)

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
