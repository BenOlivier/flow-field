import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'

export default class FlowField
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.debug = this.experience.debug
        const perlinNoise = new PerlinNoise()

        this.vectors = []
        const gridSize = new THREE.Vector3(5, 5, 5)
        const gridStep = 1
        const offset = new THREE.Vector3(0, 0, 0)
        const offsetSpeed = 0

        this.params = {
            x: 1,
            y: 1,
            z: 1
        }
        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('flowField')
        }
        this.debugFolder.add(this.params, 'x', 0, 1)

        for(let x = -gridSize.x / 2 + (gridStep / 2); x < gridSize.x / 2 + (gridStep / 2); x += gridStep)
        {
            for(let y = -gridSize.y / 2 + (gridStep / 2); y < gridSize.y / 2 + (gridStep / 2); y += gridStep)
            {
                for(let z = -gridSize.z / 2 + (gridStep / 2); z < gridSize.z / 2 + (gridStep / 2); z += gridStep)
                {
                    const noise = perlinNoise.noise(
                        (x + gridSize.x / 2) / gridSize.x, 
                        (y + gridSize.x / 2) / gridSize.y, 
                        (z + gridSize.x / 2) / gridSize.z
                    )

                    const angle = new THREE.Euler(this.params.x, this.params.y, this.params.z)

                    // const angle = new THREE.Euler(
                    //     Math.cos(noise * Math.PI * 2), 
                    //     Math.sin(noise * Math.PI * 2), 
                    //     Math.cos(noise * Math.PI * 2))
                    // console.log(angle)
                    
                    const arrowHelper = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 1, 1).applyEuler(angle).multiplyScalar(1),
                        new THREE.Vector3(x, y, z),
                        0.2,
                        0x0000ff,
                        0.06,
                        0.06
                    )
                    this.scene.add(arrowHelper)
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