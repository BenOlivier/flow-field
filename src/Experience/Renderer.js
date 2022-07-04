import * as THREE from 'three'
import Experience from './Experience.js'

export default class Renderer
{
    constructor()
    {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera
        this.debug = this.experience.debug

        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('renderer')
        }

        this.setRenderer()
    }

    setRenderer()
    {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        })
        this.renderer.physicallyCorrectLights = true
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.toneMapping = THREE.NoToneMapping
        this.renderer.toneMappingExposure = 1.75
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setClearColor('#ffffff')
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))

        if(this.debug.active)
        {
            this.debugFolder.add(this.renderer, 'toneMapping', {
                No: THREE.NoToneMapping,
                Linear: THREE.ReinhardToneMapping,
                Cineon: THREE.CineonToneMapping,
                ACESFilmic: THREE.ACESFilmicToneMapping
            })
            
            this.debugFolder.add(this.renderer, 'toneMappingExposure').min(0).max(10).step(0.001)
        }
    }

    resize()
    {
        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(Math.min(this.sizes.pixelRatio, 2))
    }

    update()
    {
        this.renderer.render(this.scene, this.camera.camera)
    }
}