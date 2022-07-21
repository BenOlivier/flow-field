// Based on flow-field by Varun Vachhar
// https://github.com/winkerVSbecks/sketchbook/blob/master/flow-field.js

import './style.css';

const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const FastPoissonDiskSampling = require('fast-2d-poisson-disk-sampling');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const simplex = new SimplexNoise();
const poisson = new FastPoissonDiskSampling({
    shape: [window.innerWidth, window.innerHeight],
    radius: 25,
    tries: 20,
});

const lines = [];
let startPoints = [];

const colors = [
    '#E6F6FF',
    '#93BDE0',
    '#5979A3',
    '#1F3466',
    '#021247',
];

const weights = [
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
];
// const weights = [
//     640 / 1270,
//     320 / 1270,
//     160 / 1270,
//     80 / 1270,
//     40 / 1270,
//     20 / 1270,
//     10 / 1270,
// ];
const probs = [];

// Sketch settings
const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const padding = 80;
const numIterations = 10;
const stepDistance = 4;
const maxSteps = 8;
const minSteps = 2;
const damping = 0.1;
const lineWidth = 3;
const margin = 8;
const scale = 2;
const turbulence = 1;

const sketch = () =>
{
    let stepsTaken = 0;
    let iteration = 1;

    return {
        begin()
        {
            generateStartPoints();

            let sum = 0;
            for (let i = 0; i < weights.length - 1; i++)
            {
                sum += (weights[i]);
                probs[i] = sum;
            }
        },
        render({ context, width, height, playhead })
        {
            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#000000';
            context.fillRect(0, 0, width, height);

            // Set line paramaters
            context.lineJoin = 'round';
            context.lineCap = 'round';

            // Define clip box
            const clipBox = [
                [padding, padding],
                [width - padding, height - padding],
            ];

            if (stepsTaken > 0)
            {
                // Create margin polylines
                const polylines = lines.map((line) => line.points);
                context.strokeStyle = '#ffffff';
                drawLines(context, polylines, margin, true);
            }

            if (stepsTaken < maxSteps)
            {
                lines.forEach((line) =>
                {
                    // If this line has not reached its full length or been stopped
                    if (stepsTaken < line.length && line.points.length === stepsTaken)
                    {
                        // Calculate next step
                        extendLine(line, width, height);
                        if (checkProximity(line.x, line.y, context) === true)
                        {
                            line.points.push([line.x, line.y]);
                        }
                    }
                });
            }
            else
            {
                // If under the max number of iterations
                if (iteration < numIterations)
                {
                    let index = 0;
                    lines.forEach((line) =>
                    {
                        // If this line is under minimum length
                        if (line.points.length < minSteps)
                        {
                            // Remove line
                            lines.splice(index, 1);
                        }
                        index++;
                    });
                    // Generate new start points and reset steps
                    generateStartPoints();
                    stepsTaken = 0;
                    iteration++;
                }
            }

            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#0f1111';
            context.fillRect(0, 0, width, height);

            // Draw new lines
            const polylines = lines.map((line) => line.points);
            const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);

            clippedLines.forEach((line) =>
            {
                const color = setColor(line[Math.floor(line.length / 2)][0],
                    line[Math.floor(line.length / 2)][1], width, height);
                line.push(color);
            });

            drawLines(context, clippedLines, lineWidth, false);
            stepsTaken++;
        },
    };
};

function generateStartPoints()
{
    // Generate evenly distributed starting points
    startPoints = poisson.fill();
    // Fill lines array with line objects
    for (let i = 0; i < startPoints.length; i++)
    {
        lines.push({
            x: startPoints[i][0],
            y: startPoints[i][1],
            velocityX: 0,
            velocityY: 0,
            points: [[startPoints[i][0], startPoints[i][1]]],
            length: Math.floor(randomInRange(minSteps, maxSteps)),
            seed: Math.random(), // TODO:
        });
    }
    // Discard poisson array
    startPoints = poisson.reset();
}

function setColor(x, y, width, height)
{
    const random = Math.random();
    let index = 0;
    for (let i = 0; i < probs.length && random >= probs[i]; i++) index = i;
    const randomValue = index / probs.length;

    const noiseValue = Math.abs(simplex.noise2D(x / width * scale,
        y / height * scale) * turbulence);
    return colors[Math.floor((noiseValue + randomValue) / 2 * colors.length)];
}

function drawLines(context, clippedLines, width, margin)
{
    context.lineWidth = width;
    clippedLines.forEach((line) =>
    {
        const [start, ...pts] = line;
        context.beginPath();
        context.moveTo(...start);
        pts.forEach((pt) =>
        {
            context.lineTo(...pt);
        });
        if (!margin) context.strokeStyle = line[line.length - 1];
        context.stroke();
    });

    // console.log(lines.length, clippedLines.length)
}

// function mapRange(value, inMin, inMax, outMin, outMax)
// {
//     return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
// }

function extendLine(line, width, height)
{
    // Calculate noise value at position
    const value = simplex.noise2D(line.x / width * scale,
        line.y / height * scale) * turbulence;

    // Update the velocity of the particle
    line.velocityX += Math.cos(value) * stepDistance;
    line.velocityY += Math.sin(value) * stepDistance;

    // Move the particle
    line.x += line.velocityX;
    line.y += line.velocityY;

    // Use damping to slow down the particle (think friction)
    line.velocityX *= damping;
    line.velocityY *= damping;
}

function checkProximity(x, y, context)
{
    // Get pixel color at point position
    const pixelData = context.getImageData(x, y, 1, 1).data;
    // If pixel is not on margin line there is space
    if (pixelData[0] !== 255)
    {
        return true;
    }
}

function randomInRange(min, max)
{
    return Math.random() * (max - min) + min;
}

canvasSketch(sketch, settings);
