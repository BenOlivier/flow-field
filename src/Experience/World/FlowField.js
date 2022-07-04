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
        this.flowField = new THREE.Group()
        this.scene.add(this.flowField)
        this.flowField.position.set(-4.5, -4.5, 0)
        
        const grid = []
        const steps = 10
        const spacing = 1

        const cubeGeo = new THREE.BoxGeometry(0.05, 0.3, 0.05)
        const cubeMat = new THREE.MeshBasicMaterial({color: '#ffffff'})

        // Create grid
        for(let column = 0; column < steps; column++)
        {
            for(let row = 0; row < steps; row++)
            {
                const xPos = spacing * column
                const yPos = spacing * row
                const zRot = column / steps * Math.PI
                const point = {x: 0, y: 0, z: zRot}
                grid.push(point)

                const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat)
                cubeMesh.position.set(xPos, yPos, 0)
                cubeMesh.quaternion.setFromEuler(new THREE.Euler(point.x, point.y, point.z))
                this.flowField.add(cubeMesh)
            }
        }

        // Draw line
        const points = []
        const startingX = 2
        const startingY = 7
        const stepLength = 1
        const numSteps = 3

        let currentX = startingX
        let currentY = startingY

        for(let step = 0; step < numSteps; step++)
        {
            const rowIndex = currentX
            // const angle = grid[]
        }

        points.push( new THREE.Vector3( startingX, startingY, 0 ) )
        points.push( new THREE.Vector3( 10, 0, 0 ) )
        const lineGeo = new THREE.BufferGeometry().setFromPoints( points )
        const lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff })
        const line = new THREE.Line( lineGeo, lineMat )
        this.flowField.add(line)
    }
}