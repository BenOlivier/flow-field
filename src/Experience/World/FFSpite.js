import * as THREE from 'three'
import Experience from '../Experience.js'
import { perlin3 } from '../Utils/Perlin.js'
// import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline'

export default class flowField
{
    constructor()
    {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.time = this.experience.time

        const size = 10

        function getGrid()
        {
            const points = []
            const step = 1
            const scale = 1
            for (let z = -0.5 * size; z < 0.5 * size; z += step) {
                for (let y = -0.5 * size; y < 0.5 * size; y += step) {
                    for (let x = -0.5 * size; x < 0.5 * size; x += step) {
                        const p = new THREE.Vector3(x, y, z)
                        p.multiplyScalar(scale)
                        points.push(p)
                    }
                }
            }
            return points
        }

        const pos = new THREE.Vector3()
        const group = new THREE.Object3D()

        function renderLines()
        {
            const points = getGrid()
            const scale = 1
            const length = 5
            const noiseScale = 1

            for (const p of points)
            {
                let tx = p.x
                let ty = p.y
                let tz = p.z

                const positions = []
                const speed = 1
                const prev = new THREE.Vector3(0, 0, 0)

                for (let j = 0; j < length; j++)
                {
                    pos.set(tx, ty, tz)
                    pos.multiplyScalar(scale)
                    const dir = perlin3(tx * noiseScale, ty * noiseScale,
                        tz * noiseScale)
                    // dir.normalize();
                    prev.lerp(dir, 0.05);

                    pos.set(tx / scale, ty / scale, tz / scale)

                    tx += speed * prev.x
                    ty += speed * prev.y
                    tz += speed * prev.z
                    positions.push(pos.clone())
                }

                const lineGeo = new THREE.BufferGeometry().setFromPoints(positions)
                const lineMat = new THREE.LineBasicMaterial( { color: 0xff0000 } )
                const line = new THREE.Line( lineGeo, lineMat )
                group.add(line)
            }
        }



        renderLines()
    }

    update()
    {
        
    }
}