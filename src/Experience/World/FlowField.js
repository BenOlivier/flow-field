import * as THREE from 'three'
import Experience from '../Experience.js'
import PerlinNoise from '../Utils/PerlinNoise.js'

function Particle(x, y, z) {
    this.pos = new THREE.Vector3(x, y, z)
    this.vel = new THREE.Vector3(0, 0, 0)
    this.acc = new THREE.Vector3(0, 0, 0)
    this.angle = new THREE.Euler(0, 0, 0)
    this.mesh = null
}

Particle.prototype.init = function(scene){
    var point = new THREE.Points(this.pointGeo, this.pointMat)
    point.geometry.dynamic  = true
    point.geometry.verticesNeedUpdate = true
    scene.add(point)
    this.mesh = point
}

Particle.prototype.update = function() {
    this.acc.set(1, 1, 1)
    this.acc.applyEuler(this.angle)
    this.acc.multiplyScalar(0.1) //this.params.noiseStrength
    
    this.acc.clampLength(0, 0.1) //this.params.particleSpeed
    this.vel.clampLength(0, 0.1) //this.params.particleSpeed
    
    this.vel.add(this.acc)
    this.pos.add(this.vel)
    
    // this.acc.multiplyScalar(params.particleDrag);
    // this.vel.multiplyScalar(params.particleDrag);
    
    if(this.pos.x > 20) this.pos.x = 0 + Math.random() //params.size
    if(this.pos.y > 20) this.pos.y = 0 + Math.random() //params.size
    if(this.pos.z > 20) this.pos.z = 0 + Math.random() //params.size
    if(this.pos.x < 0) this.pos.x = 20 - Math.random()
    if(this.pos.y < 0) this.pos.y = 20 - Math.random()
    if(this.pos.z < 0) this.pos.z = 20 - Math.random()
    
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z)
}

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
            size: 24,
            noiseScale: 0.1,
            noiseSpeed: 0.005,
            noiseStrength: 0.1,
            noiseFreeze: false,
            particleCount: 5000,
            particleSize: 0.5,
            particleSpeed: 0.1,
            particleDrag: 0.9,
            particleColor: 0xffffff
        }

        if(this.debug.active)
        {
            this.debugFolder = this.debug.ui.addFolder('flowField')
            this.debugFolder.add(this.params, 'size', 1, 100)
            this.debugFolder.add(this.params, 'noiseScale', 0, 0.5)
            this.debugFolder.add(this.params, 'noiseSpeed', 0, 0.05)
            this.debugFolder.add(this.params, 'noiseStrength', 0, 0.5)
            this.debugFolder.add(this.params, 'noiseFreeze');

            this.debugFolder.add(this.params, 'particleCount', 0, 40000)
            this.debugFolder.add(this.params, 'particleSize', 0, 1)
            this.debugFolder.add(this.params, 'particleSpeed', 0, 0.2)
            this.debugFolder.add(this.params, 'particleDrag', 0.8, 1.00)
            this.debugFolder.addColor(this.params, 'particleColor')
        }

        this.frameCount = 0
        this.gridIndex = 0
        this.noise = 0
        this.noiseOffset = Math.random() * 100
        this.numParticlesOffset = 0
        this.p = null

        this.setParticles()
    }

    setParticles()
    {
        this.particles = []

        this.pointGeo = new THREE.BufferGeometry().setFromPoints
            (new THREE.Vector3(0, 0, 0))

        this.pointMat = new THREE.PointsMaterial({
            color: this.params.particleColor,
            size: this.params.particleSize,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        })
    }

    update()
    {
        // Update particle count
        this.numParticlesOffset = parseInt(this.params.particleCount - this.particles.length)

        if(this.numParticlesOffset > 0)
        {
            for(let i = 0; i < this.numParticlesOffset; i++)
            {
                // var particle = new Particle(
                //     Math.random() * this.params.size,
                //     Math.random() * this.params.size,
                //     Math.random() * this.params.size
                // )
                var particle = new Particle(0, 0, 0)
                particle.init(this.scene)
                this.particles.push(particle)
            }
        }
        else
        {
            for(let i = 0; i < -this.numParticlesOffset; i++)
            {
                this.scene.remove(this.particles[i].mesh)
                this.particles[i] = null
                this.particles.splice(i, 1)
            }
        }

        // Update particles based on their coords
        for(let i = 0; i < this.particles.length; i++)
        {
            var particle = this.particles[i]
            
            var noise = this.perlinNoise.noise(
                particle.pos.x * this.params.noiseScale,
                particle.pos.y * this.params.noiseScale,
                particle.pos.z * this.params.noiseScale + this.noiseOffset
                    + this.frameCount * this.params.noiseSpeed
            ) * Math.PI * 2

            particle.angle.set(noise, noise, noise)
            particle.update()
        }
        
        // material.color.setHex(params.particleColor)
        // material.size = params.particleSize
        // if(!params.noiseFreeze) frameCount++
    }
}