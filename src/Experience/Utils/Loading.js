import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Loading
{
    constructor()
    {
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.time = this.experience.time
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.renderer = this.experience.renderer
        this.debug = this.experience.debug
        this.heading = document.querySelector('.heading')
        this.downButton = document.querySelector('.down-button')

        // Events
        this.sizes.on('resize', () =>
        {
            this.resize()
        })
        this.time.on('tick', () =>
        {
            if(this.loadingBar.parent == this.scene) this.updateLoadingBar()
        })

        // Parameters
        this.params = {
            loadingBarSmoothing: 0.05,
            fadeInTime: 2
        }
        
        this.setLoadingBar()
        this.setOverlay()
    }

    setOverlay()
    {
        this.overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
        this.overlayMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms:
            {
                uAlpha: { value: 1 }
            },
            vertexShader: `
                void main()
                {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uAlpha;
                void main()
                {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
                }
            `
        })

        this.overlay = new THREE.Mesh(this.overlayGeometry, this.overlayMaterial)
        this.overlay.renderOrder = 0
        this.scene.add(this.overlay)
    }

    setLoadingBar()
    {
        this.loadingBarWidth = 0.5

        if(this.sizes.width > 1000)
        {
            this.loadingBarWidth = 300 / this.sizes.width
        }
        
        this.loadingBarGeometry = new THREE.PlaneGeometry(this.loadingBarWidth,
            this.sizes.height * 0.00001, 1, 1)
        this.loadingBarMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms:
            {
                uProgress: { value: 0.0 },
                uAlpha: { value: 1.0 },
                uResolution: { value: new THREE.Vector2(this.sizes.width, this.sizes.height) }
            },
            vertexShader: `
                varying vec2 vUv;

                void main()
                {
                    gl_Position = vec4(position, 1.0);
                    vUv = uv;
                }
            `,
            fragmentShader: `
                uniform float uProgress;
                uniform float uAlpha;
                varying vec2 vUv;

                void main()
                {
                    float fragColor = step(vUv.x, uProgress);
                    gl_FragColor = vec4(vec3(fragColor), uAlpha);
                }
            `
        })

        this.loadingBar = new THREE.Mesh(this.loadingBarGeometry, this.loadingBarMaterial)
        this.loadingBar.renderOrder = 999
        this.scene.add(this.loadingBar)
    }

    updateLoadingBar()
    {
        if(this.experience.resources.progressRatio == 0)
        {
            this.loadingBarMaterial.uniforms.uProgress.value += 0.002
        }
        else
        {
            this.loadingBarMaterial.uniforms.uProgress.value += this.experience.resources.progressRatio
                * this.params.loadingBarSmoothing
        }
    }

    initiateLoadedSequence()
    {
        // Fade out loading bar
        setTimeout(() => {
            this.fadeLoadingBar()
        }, 250)
        // Fade out overlay
        setTimeout(() => {
            this.fadeOverlay()
        }, 250)
        // Destroy loading bar and overlay
        setTimeout(() => {
            this.destroy()
        }, 4000)
    }

    fadeLoadingBar()
    {
        let barAlpha = 1
        let interval = setInterval(() =>
        {
            this.loadingBarMaterial.uniforms.uAlpha.value = animateFade(barAlpha)
        }, 10)

        function animateFade()
        {
            if(barAlpha > 0)
            {
                barAlpha -= 0.05
                return barAlpha
            }
            else
            {
                clearInterval(interval)
                return 0
            }
        }
    }

    fadeOverlay()
    {
        let overlayAlpha = 1
        let fadeInTime = this.params.fadeInTime
        let interval = setInterval(() =>
        {
            this.overlayMaterial.uniforms.uAlpha.value = animateFade(overlayAlpha)
        }, 10)

        function animateFade()
        {
            if(overlayAlpha > 0)
            {
                overlayAlpha -= 1 / (fadeInTime * 100)
                return overlayAlpha
            }
            else
            {
                clearInterval(interval)
                return 0
            }
        }
    }

    resize()
    {
        this.loadingBarMaterial.uniforms.uResolution.value.x
            = this.sizes.width
        this.loadingBarMaterial.uniforms.uResolution.value.y
            = this.sizes.height
    }

    destroy()
    {
        this.scene.remove(this.loadingBar)
        this.scene.remove(this.overlay)
        this.overlayGeometry.dispose()
        this.loadingBarGeometry.dispose()
        this.overlayMaterial.dispose()
        this.loadingBarMaterial.dispose()
    }
}