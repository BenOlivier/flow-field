import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline'

export default class flowField
{
    constructor()
    {
        this.experience = new Experience()
        this.perlinNoise = new PerlinNoise()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.debug = this.experience.debug

        this.params = {
            gridSize: 3,
            gridStep: 1,
            noiseScale: 1,
            noiseSpeed: 0.0002
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

        this.lines = []
        this.flowField = new THREE.Object3D()
        this.scene.add(this.flowField)

        function CreateLine(x, y, z){
            const line = {
                points: [x, y, z],
                angle: new THREE.Euler(0, 0, 0),
                vec3: new THREE.Vector3(0, 0, 0),
                length: 20
            }
            return line
        }

        // Instantiate lines
        for(let i = -0.5 * this.params.gridSize; i <= 0.5 * this.params.gridSize; i += this.params.gridStep)
        {
            for(let j = -0.5 * this.params.gridSize; j <= 0.5 * this.params.gridSize; j += this.params.gridStep)
            {
                for(let k = -0.5 * this.params.gridSize; k <= 0.5 * this.params.gridSize; k += this.params.gridStep)
                {
                    const line = CreateLine(i, j, k)
                    this.lines.push(line)
                }
            }
        }

        for(const line of this.lines)
        {
            const positions = []
            for(let i = 0; i < line.length * 3; i += 3)
            {
                const noise = this.perlinNoise.noise(
                    line.points[i] * this.params.noiseScale,
                    line.points[i + 1] * this.params.noiseScale,
                    line.points[i + 2] * this.params.noiseScale + this.time.elapsed * this.params.noiseSpeed
                ) * Math.PI * 4
                        
                line.angle.set(noise, noise, noise)
                line.vec3.set(1, 1, 1)
                line.vec3.applyEuler(line.angle)
                line.vec3.multiplyScalar(0.1)

                for(let j = 0; j < 3; j++)
                {
                    line.points.push(line.points[i + j] + line.vec3.x) // Clone necessary?
                }

                const pos = new THREE.Vector3(
                    line.points[i],
                    line.points[i + 1],
                    line.points[i + 2]
                )
                positions.push(pos.clone())
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(positions)
            const lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } )
            const lineMesh = new THREE.Line( lineGeo, lineMat )
            this.flowField.add(lineMesh)
        }
    }

    update()
    {
        
    }
}