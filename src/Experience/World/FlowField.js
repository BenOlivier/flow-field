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
        const simplex = new SimplexNoise()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.debug = this.experience.debug
        this.lineMat = new THREE.LineBasicMaterial( { color: 0x00ff00 } )

        this.params = {
            gridSize: 1,
            gridStep: 0.25,
            lineSpeed: 20,
            lineLength: 10,
            noiseScale: 0.5,
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
        for (let z = -this.params.gridSize;
            z < this.params.gridSize;
            z += this.params.gridStep)
        {
            for (let y = -this.params.gridSize;
                y < this.params.gridSize;
                y += this.params.gridStep)
            {
                for (let x = -this.params.gridSize;
                    x < this.params.gridSize;
                    x += this.params.gridStep)
                {
                    const line = CreateLine(new THREE.Vector3(x, y, z))
                    this.lines.push(line)
                }
            }
        }

        this.frame = 0
        this.total = 0
    }

    update()
    {
        this.frame++
        if(this.frame > 60 / this.params.lineSpeed)
        {
            this.frame = 0
            this.total++
            this.disposePrevious()
            this.calculateNextPoints()
        }
        
    }

    disposePrevious()
    {
        this.flowField.children.forEach(function (child) //TODO:
        {
            if(child instanceof THREE.Line)
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
            // Remove point from start of line
            if(line.points.length > this.params.lineLength)
            {
                line.points.shift()
            }
            // Calculate noise value at last point
            const noise = this.perlinNoise.noise(
                line.points[line.points.length - 1].x * this.params.noiseScale,
                line.points[line.points.length - 1].y * this.params.noiseScale,
                line.points[line.points.length - 1].z * this.params.noiseScale
            ) * Math.PI * 2
            // Convert noise value to angle
            line.angle.set(Math.cos(noise), Math.sin(noise), Math.cos(noise))
            line.vec3.set(
                line.points[line.points.length - 1].x,
                line.points[line.points.length - 1].y,
                line.points[line.points.length - 1].z
            )
            // Apply angle to line's direction
            line.vec3.applyEuler(line.angle)
            line.vec3.multiplyScalar(this.params.pointFrequency)
            line.points.push(new THREE.Vector3(
                line.points[line.points.length - 1].x + line.vec3.x,
                line.points[line.points.length - 1].y + line.vec3.y,
                line.points[line.points.length - 1].z + line.vec3.z
            ))
            // Create new lines
            const lineGeo = new THREE.BufferGeometry().setFromPoints(line.points)
            const lineMesh = new THREE.Line( lineGeo, this.lineMat )
            this.flowField.add(lineMesh)
        }
    }
}