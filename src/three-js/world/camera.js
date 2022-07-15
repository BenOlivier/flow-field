import * as THREE from 'three';
import Experience from '../experience.js';

export default class Camera
{
    constructor()
    {
        this.experience = new Experience();
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.canvas = this.experience.canvas;
        this.debug = this.experience.debug;

        this.setCamera();
    }

    setCamera()
    {
        this.camera = new THREE.PerspectiveCamera(35,
            this.sizes.width / this.sizes.height, 0.1, 100);
        this.camera.position.set(0, 0, 10);

        this.scene.add(this.camera);
    }

    resize()
    {
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
    }
}
