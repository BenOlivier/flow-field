import * as THREE from 'three';
import EventEmitter from './event-emitter.js';
import Experience from '../experience.js';

export default class Pointer extends EventEmitter
{
    constructor()
    {
        super();

        // Setup
        this.pointerPos = new THREE.Vector2();
        this.experience = new Experience();
        this.time = this.experience.time;
        this.sizes = this.experience.sizes;
        this.debug = this.experience.debug;

        // Pointer down event
        window.addEventListener('pointerdown', (event) =>
        {
            this.pointerPos.x = event.clientX / this.sizes.width * 2 - 1;
            this.pointerPos.y = -(event.clientY / this.sizes.height) * 2 + 1;
            this.trigger('pointerdown');
        });

        // Pointer move event
        window.addEventListener('pointermove', (event) =>
        {
            this.pointerPos.x = event.clientX / this.sizes.width * 2 - 1;
            this.pointerPos.y = -(event.clientY / this.sizes.height) * 2 + 1;
            this.trigger('pointermove');
        });

        // Pointer up event
        window.addEventListener('pointerup', (event) =>
        {
            this.trigger('pointerup');
        });
    }
}
