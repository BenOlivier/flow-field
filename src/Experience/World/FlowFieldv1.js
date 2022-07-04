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
            gridSize: 4,
            gridStep: 1,
            noiseScale: 0.1,
            noiseSpeed: 0.0002,

            lineCount: 3,
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
                    this.angle.toVector3(),
                    new THREE.Vector3( this.x, this.y, this.z ),
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
        for(let i = -0.5 * this.params.gridSize; i <= 0.5 * this.params.gridSize; i += this.params.gridStep)
        {
            for(let j = -0.5 * this.params.gridSize; j <= 0.5 * this.params.gridSize; j += this.params.gridStep)
            {
                for(let k = -0.5 * this.params.gridSize; k <= 0.5 * this.params.gridSize; k += this.params.gridStep)
                {
                    var vector = new Vector(i, j, k)
                    this.vectors.push(vector)
                }
            }
        }

        //////////////////////////////////////////////////////////
        //                      LINES                           //
        //////////////////////////////////////////////////////////

        const lines = []

        for(let i = 0; i < this.params.lineCount; i++)
        {
            const pos = new THREE.Vector3(
                Math.random() * this.params.gridSize - this.params.gridSize / 2,
                Math.random() * this.params.gridSize - this.params.gridSize / 2,
                Math.random() * this.params.gridSize - this.params.gridSize / 2
            )
            // lines.push(pos)
        }
        
        for(const line of lines)
        {
            const positions = []

            for(let i = 0; i < this.params.lineLength; i++)
            {
                positions.push(pos.clone())
            }

            const lineGeo = new THREE.BufferGeometry().setFromPoints(positions)
            const lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } )
            const line = new THREE.Line( lineGeo, lineMat )
            this.flowField.add(line)
        }
    }

    update()
    {
        for(let i = 0; i < this.vectors.length; i++)
        {
            var vector = this.vectors[i]

            var noise = this.perlinNoise.noise(
                vector.x * this.params.noiseScale,
                vector.y * this.params.noiseScale,
                vector.z * this.params.noiseScale + this.time.elapsed * this.params.noiseSpeed
            ) * Math.PI * 4
            
            vector.angle.set(noise, noise, noise)
            vector.update(this.flowField)
        }
    }
}