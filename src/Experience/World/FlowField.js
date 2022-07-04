import * as THREE from 'three'
import { Quaternion } from 'three'
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
        const spacing = 1
        const points = []

        const cubeGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05)
        const cubeMat = new THREE.MeshBasicMaterial({color: '#ffffff'})

        for(let column = 0; column < steps; column++)
        {
            for(let row = 0; row < steps; row++)
            {
                const xPos = spacing * column - (steps / 2 * spacing) + (spacing / 2)
                const yPos = spacing * row - (steps / 2 * spacing) + (spacing / 2)
                const zRot = column / steps * Math.PI
                const point = {x: 0, y: 0, z: zRot}
                points.push(point)

                const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat)
                cubeMesh.position.set(xPos, yPos, 0)
                cubeMesh.quaternion.setFromEuler(new THREE.Euler(point.x, point.y, point.z))
                this.scene.add(cubeMesh)
            }
        }
    }
}