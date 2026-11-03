// babylon-001 starter scene: floor + sky + cube + hemispheric light + ambient + sun.
// Babylon has no AmbientLight class: ambient = scene.ambientColor * material.ambientColor.
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
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SkyMaterial } from '@babylonjs/materials/sky/skyMaterial'

// --- Engine / scene / camera ---
const canvas = document.querySelector<HTMLCanvasElement>('#app')!
const engine = new Engine(canvas, true)
const scene = new Scene(engine)
scene.ambientColor = new Color3(0.2, 0.2, 0.2) // global ambient fill

const camera = new ArcRotateCamera('cam', Math.PI / 4, Math.PI / 3, 12, new Vector3(0, 0.5, 0), scene)
camera.attachControl(canvas, true)

// --- Sun direction (shared by sky shader and directional light) ---
const sunDir = new Vector3(-0.4, -0.8, -0.45).normalize() // light travels this way

// --- Sky ---
const skyMat = new SkyMaterial('skyMat', scene)
skyMat.backFaceCulling = false
skyMat.useSunPosition = true
skyMat.sunPosition = sunDir.scale(-100)
const skybox = CreateBox('sky', { size: 1000 }, scene)
skybox.material = skyMat
skybox.infiniteDistance = true

// --- Lights: hemispheric (sky/ground tint) + sun (shadows) ---
const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)
hemi.diffuse = Color3.FromHexString('#bfd8ff')
hemi.groundColor = Color3.FromHexString('#6b5a3a')
hemi.intensity = 0.8
const sun = new DirectionalLight('sun', sunDir, scene)
sun.position = sunDir.scale(-30)
sun.intensity = 1.5
const shadows = new ShadowGenerator(2048, sun)
shadows.usePercentageCloserFiltering = true

// --- Floor ---
const groundMat = new StandardMaterial('groundMat', scene)
groundMat.diffuseColor = Color3.FromHexString('#5b8c3a')
groundMat.ambientColor = Color3.White()
const ground = CreateGround('floor', { width: 64, height: 64 }, scene)
ground.material = groundMat
ground.receiveShadows = true

// --- Cube (1x1x1 block sitting on the floor) ---
const cubeMat = new StandardMaterial('cubeMat', scene)
cubeMat.diffuseColor = Color3.FromHexString('#8b5a2b')
cubeMat.ambientColor = Color3.White()
const cube = CreateBox('cube', { size: 1 }, scene)
cube.position.y = 0.5
cube.material = cubeMat
shadows.addShadowCaster(cube)

// --- Resize + loop ---
window.addEventListener('resize', () => engine.resize())
engine.runRenderLoop(() => scene.render())
