import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'

export default class Object
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
            noiseScale: 0.1,
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

        this.vectors = []
        this.flowField = new THREE.Group()
        this.flowField.position.set(-this.params.gridSize / 2,
            -this.params.gridSize / 2, -this.params.gridSize / 2)
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
                    0.08,
                    0.08
                )
                flowField.add(arrowHelper)
                this.arrow = arrowHelper
            }
            this.arrow.setDirection(this.vec3.normalize())
        }

        for(let i = 0; i <= this.params.gridSize; i++)
        {
            for(let j = 0; j <= this.params.gridSize; j++)
            {
                for(let k = 0; k <= this.params.gridSize; k++)
                {
                    var vector = new Vector(i, j, k)
                    this.vectors.push(vector)
                }
            }
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