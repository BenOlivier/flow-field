import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'
import Noise from '../Utils/Noise.js'
import SimplexNoise from 'simplex-noise'
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline'
import { getPalette } from '../Utils/color-palettes.js'

function randomInRange(min, max) {
    return Math.random() * (max - min) + min
}

function createLine(_position, _material){
    const line = {
        points: [_position],
        angle: new THREE.Euler(0, 0, 0),
        vec3: new THREE.Vector3(0, 0, 0),
        speed: 0.05,//randomInRange(0.02, 0.01),
        length: 200,
        lifetime: 20,
        age: 0,
        material: _material
    }
    return line
}

export default class flowField
{
    constructor()
    {
        this.experience = new Experience()
        this.perlinNoise = new PerlinNoise()
        this.noise = new Noise()
        const simplex = new SimplexNoise()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.camera = this.experience.camera
        this.debug = this.experience.debug
        this.pointer = this.experience.pointer
        const palette = getPalette()
        this.lineMats = [
            new MeshLineMaterial({ color: palette[0], lineWidth: randomInRange(0.05, 0.2) }),
            new MeshLineMaterial({ color: palette[1], lineWidth: randomInRange(0.05, 0.2) }),
            new MeshLineMaterial({ color: palette[2], lineWidth: randomInRange(0.05, 0.2) }),
            new MeshLineMaterial({ color: palette[3], lineWidth: randomInRange(0.05, 0.2) }),
            new MeshLineMaterial({ color: palette[4], lineWidth: randomInRange(0.05, 0.2) }),
            new MeshLineMaterial({ color: palette[5], lineWidth: randomInRange(0.05, 0.2) })
        ]

        this.params = {
            sphereRadius: 0.2,
            noiseScale: 0.001,
            noiseSpeed: 0.001,
            rotateSpeed: 0.0002
        }

        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('flowField')
            this.debugFolder.add(this.params, 'gridSize', 1, 20)
            this.debugFolder.add(this.params, 'noiseScale', 0, 100)
            this.debugFolder.add(this.params, 'noiseSpeed', 0, 0.05)
            this.debugFolder.add(this.params, 'noiseStrength', 0, 0.5)
            this.debugFolder.add(this.params, 'noiseFreeze');
            this.debugFolder.add(this.params, 'vectorDebug');

            this.debugFolder.add(this.params, 'particleCount', 0, 40000)
            this.debugFolder.add(this.params, 'particleSize', 0, 1)
            this.debugFolder.add(this.params, 'particleSpeed', 0, 0.2)
            this.debugFolder.add(this.params, 'particleDrag', 0.8, 1.00)
            this.debugFolder.addColor(this.params, 'particleColor')
        }

        this.mouseVec = new THREE.Vector3(0, 0, 0)
        this.spawnPos = new THREE.Vector3(0, 0, 0)

        this.pointer.on('pointerdown', () =>{
            this.generateParticles = true
        })
        this.pointer.on('pointerup', () =>{
            this.generateParticles = false
        })

        this.lines = []
        this.flowField = new THREE.Object3D()
        this.scene.add(this.flowField)
        this.instanceTimer = 0
    }

    update()
    {
        this.instanceTimer++
        if(this.instanceTimer > 60 / 60)
        {
            this.instanceTimer = 0
            if(this.generateParticles) this.instantiateLine()
        }

        // this.flowField.rotation.y += this.time.delta * this.params.rotateSpeed
        
        this.disposePrevious()
        this.calculateNextPoints()
    }

    instantiateLine()
    {
        this.mouseVec.set(this.pointer.pointerPos.x, this.pointer.pointerPos.y, 0)
            .unproject(this.camera.camera).sub(this.camera.camera.position).normalize()
        this.spawnPos.copy(this.camera.camera.position).add(this.mouseVec.multiplyScalar
            ((0 - this.camera.camera.position.z ) / this.mouseVec.z))

        const randomDir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        const randomPos = randomDir.multiplyScalar(this.params.sphereRadius)
        const line = createLine(new THREE.Vector3(
            this.spawnPos.x + randomPos.x,
            this.spawnPos.y + randomPos.y,
            this.spawnPos.z + randomPos.z),
            this.lineMats[Math.floor(Math.random() * this.lineMats.length)])
        this.lines.push(line)
    }

    disposePrevious()
    {
        this.flowField.children.forEach(function (child){
            if(child instanceof THREE.Mesh)
            {
                child.geometry.dispose()
            }
        })
        this.flowField.remove(...this.flowField.children)
    }

    calculateNextPoints()
    {
        for(const line of this.lines)
        {
            line.age++
            if(line.age > line.lifetime)
            {
                line.points.shift()
                line.length--
                if(line.length < 2) this.lines.shift()
            }
            
            // Remove point from start of line
            if(line.points.length > line.length) line.points.shift()

            // Calculate noise value at last point
            const noise = this.perlinNoise.noise(
                line.points[line.points.length - 1].x * this.params.noiseScale,
                line.points[line.points.length - 1].y * this.params.noiseScale,
                line.points[line.points.length - 1].z * this.params.noiseScale
                + this.time.elapsed * this.params.noiseSpeed
            ) * Math.PI * 2
            // Convert noise value to angle
            line.angle.set(Math.sin(noise), Math.sin(noise), Math.cos(noise))
            line.vec3.set(
                line.points[line.points.length - 1].x - this.spawnPos.x,
                line.points[line.points.length - 1].y - this.spawnPos.y,
                line.points[line.points.length - 1].z - this.spawnPos.z
            )
            // Apply angle to line's direction
            line.vec3.applyEuler(line.angle)
            line.vec3.multiplyScalar(line.speed)
            line.points.push(new THREE.Vector3(
                line.points[line.points.length - 1].x + line.vec3.x,
                line.points[line.points.length - 1].y + line.vec3.y,
                line.points[line.points.length - 1].z + line.vec3.z
            ))
            // Create new lines
            const lineGeo = new THREE.BufferGeometry().setFromPoints(line.points)
            const lineInstance = new MeshLine()
            lineInstance.setGeometry(lineGeo)
            // lineInstance.setPoints(lineGeo, p => 1 - p)
            const lineMesh = new THREE.Mesh(lineInstance, line.material)
            this.flowField.add(lineMesh)
        }
    }
}