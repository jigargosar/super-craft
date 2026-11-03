// three-001 starter scene: floor + sky + cube + hemisphere/ambient/sun lights.
// Renderer: WebGLRenderer (Sky addon is WebGL-only; WebGPU uses SkyMesh instead).
import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Sky } from 'three/addons/objects/Sky.js'

// --- Renderer / scene / camera ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.toneMapping = THREE.ACESFilmicToneMapping

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000)
camera.position.set(6, 5, 8)
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.5, 0)

// --- Sun direction (shared by sky shader and directional light) ---
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(50), THREE.MathUtils.degToRad(30))

// --- Sky ---
const sky = new Sky()
sky.scale.setScalar(1000)
sky.material.uniforms.sunPosition.value.copy(sunDir)
scene.add(sky)

// --- Lights: hemisphere (sky/ground tint) + ambient (flat fill) + sun (shadows) ---
scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x6b5a3a, 0.8))
scene.add(new THREE.AmbientLight(0xffffff, 0.2))
const sun = new THREE.DirectionalLight(0xffffff, 2)
sun.position.copy(sunDir).multiplyScalar(30)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20 })
scene.add(sun)

// --- Floor ---
const floor = new THREE.Mesh(new THREE.PlaneGeometry(64, 64), new THREE.MeshStandardMaterial({ color: 0x5b8c3a }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// --- Cube (1x1x1 block sitting on the floor) ---
const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }))
cube.position.y = 0.5
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
