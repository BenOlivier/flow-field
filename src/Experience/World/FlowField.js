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
            gridSize: 5,
            gridStep: 1,
            noiseScale: 0.1
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
                points: [new THREE.Vector3(x, y, z)],
                angle: new THREE.Euler(0, 0, 0),
                vec3: new THREE.Vector3(0, 0, 0),
                length: 10
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
            for(let i = 0; i < line.length; i ++)
            {
                const noise = this.perlinNoise.noise(
                    line.points[i].x * this.params.noiseScale,
                    line.points[i].y * this.params.noiseScale,
                    line.points[i].z * this.params.noiseScale
                ) * Math.PI * 4

                line.angle.set(noise, noise, noise)
                line.vec3.set(1, 1, 1)
                line.vec3.applyEuler(line.angle)
                line.vec3.multiplyScalar(0.1)
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