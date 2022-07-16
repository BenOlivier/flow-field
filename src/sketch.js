// Based on flow-field by Varun Vachhar
// https://github.com/winkerVSbecks/sketchbook/blob/master/flow-field.js

import './style.css';

const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const FastPoissonDiskSampling = require('fast-2d-poisson-disk-sampling');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const { mapRange } = require('canvas-sketch-util/math');
const lerp = require('lerp');
const simplex = new SimplexNoise();
const poisson = new FastPoissonDiskSampling({
    shape: [window.innerWidth, window.innerHeight],
    radius: 20,
    tries: 20,
});

const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const colors = {
    red: '#da3900',
    blue: '#5555ff',
    black: '#111111',
    white: '#ffffff',
};

const padding = 100;
const debug = true;
const damping = 0.1;
const step = 10;
const particleSteps = 60;
const sketch = () =>
{
    let particles = [];
    let stepsTaken = 0;

    return {
        begin()
        {
            // Generate evenly distributed starting points
            const points = poisson.fill();
            for (let i = 0; i < points.length; i++)
            {
                particles.push({
                    x: points[i][0],
                    y: points[i][1],
                    vx: 0,
                    vy: 0,
                    line: [],
                    color: colors.blue,
                });
            }
        },
        render({ context, width, height, playhead })
        {
            context.clearRect(0, 0, width, height);
            context.fillStyle = colors.black;
            context.fillRect(0, 0, width, height);

            const clipBox = [
                [padding, padding],
                [width - padding, height - padding],
            ];

            if (debug)
            {
                drawVectorField(context, width, height);
            }

            stepsTaken = Math.floor(mapRange(playhead, 0, 1, 0, particleSteps));
            if (particles[0].line.length < particleSteps)
            {
                particles.forEach((particle) =>
                {
                    moveParticle(particle);
                });
            }
            else
            {

            }

            const lines = particles.map((particle) => particle.line);
            const clippedLines = clipPolylinesToBox(lines, clipBox, false, false);

            context.lineWidth = 1;
            context.lineJoin = 'round';
            context.lineCap = 'round';

            clippedLines.forEach((line, index) =>
            {
                const [start, ...pts] = line;

                context.beginPath();
                context.moveTo(...start);
                pts.forEach((pt) =>
                {
                    context.lineTo(...pt);
                });

                context.strokeStyle = particles[index].color;
                context.stroke();
            });
        },
    };
};

canvasSketch(sketch, settings);

function moveParticle(particle)
{
    // Calculate UV position
    const uvPos = [
        particle.x / window.innerWidth,
        particle.y / window.innerHeight,
    ];

    // Calculate direction from noise
    const value = simplex.noise2D(uvPos[0], uvPos[1]);

    // Update the velocity of the particle
    particle.vx += Math.cos(value) * step;
    particle.vy += Math.sin(value) * step;

    // Move the particle
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Use damping to slow down the particle (think friction)
    particle.vx *= damping;
    particle.vy *= damping;

    particle.line.push([particle.x, particle.y]);
}

function drawVectorField(context, width, height)
{
    const gridDensity = 40;
    const gridSize = [width / gridDensity, height / gridDensity];
    const tileSize = (width - padding * 2) / gridSize[0];
    const vectorLength = tileSize * 0.5;
    const vectorThickness = 2;

    for (let x = 0; x < gridSize[0]; x++)
    {
        for (let y = 0; y < gridSize[1]; y++)
        {
            // get a 0-1 UV coordinate
            const u = x / (gridSize[0] - 1);
            const v = y / (gridSize[1] - 1);

            // scale to dimensions with a border padding
            const uv = {
                x: lerp(padding, width - padding, u),
                y: lerp(padding, height - padding, v),
            };

            // Draw
            context.save();
            context.fillStyle = colors.white;

            const rotation = simplex.noise3D(x / gridSize[0],
                y / gridSize[1], 0) * Math.PI;

            // Rotate in place
            context.translate(uv.x, uv.y);
            context.rotate(rotation);
            context.translate(-uv.x, -uv.y);

            // Draw the line
            context.fillRect(uv.x, uv.y - vectorThickness, vectorLength, vectorThickness);
            context.restore();
        }
    }
}
