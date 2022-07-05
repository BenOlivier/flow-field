import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'
import Noise from '../Utils/Noise.js'
import SimplexNoise from 'simplex-noise'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline'

export default class flowField
{
    constructor()
    {
        this.experience = new Experience()
        this.perlinNoise = new PerlinNoise()
        this.noise = new Noise()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.debug = this.experience.debug

        this.params = {
            linesCount: 10,
            sphereRadius: 5,
            noiseScale: 0.001,
            pointFrequency: 0.1
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

        const simplex = new SimplexNoise()
        // value2d = simplex.noise2D(x, y),
        // value3d = simplex.noise3D(x, y, z),
        // value4d = simplex.noise4D(x, y, z, w);

        this.lines = []
        this.flowField = new THREE.Object3D()
        this.scene.add(this.flowField)

        function CreateLine(position){
            const line = {
                points: [position],
                angle: new THREE.Euler(0, 0, 0),
                vec3: new THREE.Vector3(0, 0, 0),
                length: 10
            }
            return line
        }

        // Instantiate lines
        // for(let i = 0; i < this.params.linesCount; i++)
        // {
        //     const direction = new THREE.Vector3(
        //         Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
        //     const position = direction.multiplyScalar(this.params.sphereRadius)
        //     const line = CreateLine(position)
        //     this.lines.push(line)
        // }
        for (let z = -1; z < 1; z += 0.2) {
            for (let y = -1; y < 1; y += 0.2) {
                for (let x = -1; x < 1; x += 0.2) {
                    const line = CreateLine(new THREE.Vector3(x, y, z))
                    this.lines.push(line)
                }
            }
        }

        for(const line of this.lines)
        {
            const positions = []
            for(let i = 0; i < line.length; i ++)
            {
                const noise = simplex.noise3D(
                    line.points[i].x * this.params.noiseScale,
                    line.points[i].y * this.params.noiseScale,
                    line.points[i].z * this.params.noiseScale
                ) * Math.PI * 16

                line.angle.set(Math.cos(noise), Math.sin(noise), Math.cos(noise))
                line.vec3.set(line.points[i].x, line.points[i].y, line.points[i].z)
                line.vec3.applyEuler(line.angle)
                line.vec3.multiplyScalar(this.params.pointFrequency)
                line.points.push(new THREE.Vector3(
                    line.points[i].x + line.vec3.x,
                    line.points[i].y + line.vec3.y,
                    line.points[i].z + line.vec3.z
                ))
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(line.points)
            const lineMat = new THREE.LineBasicMaterial( { color: 0x00ff00 } )
            const lineMesh = new THREE.Line( lineGeo, lineMat )
            this.flowField.add(lineMesh)
        }
    }

    update()
    {
        
    }
}