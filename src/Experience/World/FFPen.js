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
            noiseScale: 0.1,
            noiseSpeed: 0.0002,
            cellSize: 1,

            lineCount: 1,
            lineLength: 3
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

        //////////////////////////////////////////////////////////
        //                      VECTORS                         //
        //////////////////////////////////////////////////////////

        this.vectors = []
        this.flowField = new THREE.Object3D()
        this.scene.add(this.flowField)

        function Vector(x, y, z){
            this.x = x
            this.y = y
            this.z = z
            this.angle = new THREE.Euler(0, 0, 0)
            this.vec3 = new THREE.Vector3(0, 0, 0)
            this.arrow = null
        }

        Vector.prototype.update = function(flowField) {
            this.vec3.set(1, 1, 1)
            this.vec3.applyEuler(this.angle)
            this.vec3.multiplyScalar(0.1)
            if(!this.arrow)
            {
                var arrowHelper = new THREE.ArrowHelper(
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(this.x, this.y, this.z),
                    0.2,
                    0x0000ff,
                    0.06,
                    0.06
                )
                flowField.add(arrowHelper)
                this.arrow = arrowHelper
            }
            this.arrow.setDirection(this.vec3.normalize())
        }

        // Instantiate vector grid
        for(let x = -0.5 * this.params.gridSize; x <= 0.5 * this.params.gridSize; x += this.params.gridStep)
        {
            this.vectors[x] = []
            for(let y = -0.5 * this.params.gridSize; y <= 0.5 * this.params.gridSize; y += this.params.gridStep)
            {
                this.vectors[x][y] = []
                for(let z = -0.5 * this.params.gridSize; z <= 0.5 * this.params.gridSize; z += this.params.gridStep)
                {
                    this.vectors[x][y][z] = []
                    const vector = new Vector(x, y, z)
                    this.vectors[x][y][z].push(vector)
                }
            }
        }

        //////////////////////////////////////////////////////////
        //                      LINES                           //
        //////////////////////////////////////////////////////////

        this.lines = []

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
        for(let i = 0; i < this.params.lineCount; i ++)
        {
            const line = CreateLine(1, 1, 1)
            this.lines.push(line)
        }
        
        for(const line of this.lines)
        {
            // const positions = []
            for(let i = 0; i < line.length; i++)
            {
                // Get array index of nearest vector
                const index = new THREE.Vector3(
                    Math.floor(line.points[i].x),
                    Math.floor(line.points[i].y),
                    Math.floor(line.points[i].z)
                )

                // console.log(index)

                line.points.push(new THREE.Vector3(i, i, i))
                
                // Get vector from grid
                // const newVec = this.vectors[index.x][index.y][index.z].vec3.clone()

                // console.log(this.vectors[index.x][index.y][index.z])

                // Apply vector to last point
                // const newPos = new THREE.Vector3(
                //     line.points[i].x + newVec.x,
                //     line.points[i].y + newVec.y,
                //     line.points[i].z + newVec.z,
                // )

                // line.points.push(newPos)
            }
            const lineGeo = new THREE.BufferGeometry().setFromPoints(line.points)
            const lineMat = new THREE.LineBasicMaterial( { color: 0x00ff00 } )
            const lineMesh = new THREE.Line( lineGeo, lineMat )
            this.flowField.add(lineMesh)
        }
    }

    update()
    {
        for(let x = 0; x < this.params.gridSize; x++)
        {
            for(let y = 0; y < this.params.gridSize; y++)
            {
                for(let z = 0; z < this.params.gridSize; z++)
                {
                    // const vector = this.vectors[x][y][z]
                    // console.log(this.vectors)
                }
            }

            // const noise = this.perlinNoise.noise(
            //     vector.x * this.params.noiseScale,
            //     vector.y * this.params.noiseScale,
            //     vector.z * this.params.noiseScale + this.time.elapsed * this.params.noiseSpeed
            // ) * Math.PI * 4
            
            // vector.angle.set(noise, noise, noise)
            // vector.update(this.flowField)
        }
    }
}