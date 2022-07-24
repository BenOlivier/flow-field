import './style.css';
import { randomInRange, remap } from './utils/math.js';
import chroma from 'chroma-js';

const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const colorPalettes = require('nice-color-palettes');
const FastPoissonDiskSampling = require('fast-2d-poisson-disk-sampling');
const lineclip = require('lineclip');
const simplex = new SimplexNoise();
const poisson = new FastPoissonDiskSampling({
    shape: [window.innerWidth, window.innerHeight],
    radius: 8,
    tries: 20,
});

const lines = [];
let startPoints = [];
const colors = [];

const palette = colorPalettes[Math.floor(Math.random() * 100)];
for (let i = 0; i < 5; i++)
{
    colors[i] = chroma.scale([palette[i], chroma(palette[i]).darken(5)]).mode('lch').colors(10);
}


const probs = [
    0,
    0.75,
    0.875,
    0.96,
    1,
];

// Sketch settings
const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const padding = 80;
const numIterations = 1;
const stepDistance = randomInRange(2, 4);
const maxSteps = 8;
const minSteps = 2;
const damping = 0.1;
const lineWidth = 2;
const lineMargin = 2;
const scale = randomInRange(0.1, 2);
const turbulence = randomInRange(1, 8 / (scale * 4));
const speed = 1;

const sketch = () =>
{
    let stepsTaken = 0;
    let iteration = 1;

    return {
        begin()
        {
            generateStartPoints();
        },
        render({ context, width, height })
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
                padding,
                padding,
                width - padding,
                height - padding,
            ];

            // Draw margin lines
            lines.forEach((line) =>
            {
                drawLine(context, line.points, lineMargin, '#ffffff');
            });

            if (stepsTaken < maxSteps)
            {
                lines.forEach((line) =>
                {
                    // If this line has not reached its full length or been stopped
                    if (stepsTaken < line.length && line.points.length === stepsTaken)
                    {
                        // Calculate next step
                        extendLine(line, width, height);
                        // If the new position is in space
                        if (checkProximity(line.x, line.y, context) === true)
                        {
                            // Add the new position to the points
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

            lines.forEach((line, index) =>
            {
                // Clip lines to box
                line.clippedPoints = lineclip(line.points, clipBox).reduce(function(a, b)
                {
                    return a.concat(b);
                }, []);
                // If line has at least 2 points
                if (line.clippedPoints.length > 1)
                {
                    // Set line's color and draw it
                    setColor(line, width, height);
                    drawLine(context, line.clippedPoints, lineWidth, line.color);
                }
                else
                {
                    // Otherwise discard
                    lines.splice(index, 1);
                }
            });
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
            clippedPoints: [],
            color: '#ffffff',
            length: Math.floor(randomInRange(minSteps, maxSteps)),
            seed: Math.random(),
        });
    }
    // Discard poisson array
    startPoints = poisson.reset();
}

function setColor(line, width, height)
{
    // Get line's middle point
    const midPoint = [
        line.clippedPoints[Math.floor(line.clippedPoints.length / 2)][0],
        line.clippedPoints[Math.floor(line.clippedPoints.length / 2)][1],
    ];

    // Calculate noise value 0 - 1
    const rawNoiseValue = Math.abs(simplex.noise2D(
        midPoint[0] / width * scale, midPoint[1] / height * scale) * turbulence);
    // Remap noise value
    const mappedNoiseValue = remap(rawNoiseValue, 0, turbulence, 0, 1);

    // Calculate random value
    let index = 0;
    for (let i = 0; probs[i] < line.seed; i++)
    {
        index = i;
    }
    const randomValue = index % 2 == 0? index / probs.length : -index / probs.length;

    // Combined value
    const colorValue = mappedNoiseValue;// + randomValue;

    // Get palette index
    const paletteIndex = Math.floor(line.seed * colors.length);
    // Color selected by combined value
    line.color = colors[paletteIndex][Math.floor(colorValue * colors.length)];
}

function drawLine(context, points, width, color)
{
    context.lineWidth = width;
    const [start, ...pts] = points;
    context.beginPath();
    context.moveTo(...start);
    pts.forEach((pt) =>
    {
        context.lineTo(...pt);
    });
    context.strokeStyle = color;
    context.stroke();
}

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

canvasSketch(sketch, settings);
