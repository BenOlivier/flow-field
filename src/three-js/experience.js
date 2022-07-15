import * as THREE from 'three';
import Stats from 'stats.js';
import Time from './utils/time.js';
import Debug from './utils/debug.js';
import Sizes from './utils/sizes.js';
import Camera from './world/camera.js';
import Pointer from './utils/pointer.js';
import Renderer from './utils/renderer.js';
import FlowField from './world/flow-field.js';

let instance = null;

export default class Experience
{
    constructor(_canvas)
    {
        // Singleton
        if (instance)
        {
            return instance;
        }
        instance = this;

        // Global access
        window.experience = this;

        // Options
        this.canvas = _canvas;

        // Setup
        this.debug = new Debug();
        this.sizes = new Sizes();
        this.time = new Time();
        this.scene = new THREE.Scene();
        this.camera = new Camera();
        this.pointer = new Pointer();
        this.renderer = new Renderer();
        this.flowField = new FlowField();
        this.stats = new Stats();
        this.stats.showPanel(2);
        document.body.appendChild(this.stats.dom);

        // Resize event
        this.sizes.on('resize', () =>
        {
            this.camera.resize();
            this.renderer.resize();
        });

        // Time tick event
        this.time.on('tick', () =>
        {
            this.stats.begin();
            this.flowField.update();
            this.renderer.update();
            this.stats.end();
        });
    }
}
