import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Object
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.debug = this.experience.debug

        this.setGrid()
    }

    setGrid()
    {
        const steps = 10
        const points = []

        const cubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        const cubeMat = new THREE.MeshBasicMaterial({color: '#ffffff'})
        const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat)

        for(let i = 0; i < steps; i++)
        {
            for(let j = 0; j < steps; j++)
            {
                const point = {x: i - 4.5, y: j - 4.5}
                points.push(point)

                const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat)
                cubeMesh.position.set(point.x, point.y, 0)
                this.scene.add(cubeMesh)
            }
        }
    }
}