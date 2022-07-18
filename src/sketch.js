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
    '#12c2e9',
    '#c471ed',
    '#c471ed',
    '#c471ed',
    '#f64f59',
];

// Sketch settings
const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const padding = 100;
const numIterations = 20;
const stepDistance = 8;
const numSteps = 10;
const minLength = 4;
const damping = 0.1;
const lineWidth = 3;
const margin = 12;
const scale = 0.5;
const turbulence = 0.8;

const sketch = () =>
{
    let stepsTaken = 0;
    let iterations = 0;

    return {
        begin()
        {
            generateStartPoints();
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

            // If steps are not complete
            if (stepsTaken < numSteps)
            {
                lines.forEach((line) =>
                {
                    // If this line has not been stopped
                    if (line.points.length === stepsTaken)
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
                if (iterations < numIterations)
                {
                    let index = 0;
                    lines.forEach((line) =>
                    {
                        // If this line is under minimum length
                        if (line.points.length < minLength)
                        {
                            // Remove line
                            lines.splice(index, 1);
                        }
                        index++;
                    });
                    // Generate new start points and reset steps
                    generateStartPoints();
                    stepsTaken = 0;
                    iterations++;
                }
            }

            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#111111';
            context.fillRect(0, 0, width, height);

            // Draw new lines
            const polylines = lines.map((line) => line.points);
            const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);
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
            color: '#ffffff',
        });
    }
    // Discard poisson array
    startPoints = poisson.reset();
}

function drawLines(context, clippedLines, width, white)
{
    context.lineWidth = width;
    clippedLines.forEach((line, index) =>
    {
        const [start, ...pts] = line;
        context.beginPath();
        context.moveTo(...start);
        pts.forEach((pt) =>
        {
            context.lineTo(...pt);
        });
        if (!white) context.strokeStyle = lines[index].color;
        context.stroke();
    });
}

function mapRange(value, inMin, inMax, outMin, outMax)
{
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
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

    const colorValue = mapRange(line.x, 100, width, 0, colors.length);
    const color = colors[Math.floor(colorValue)];
    console.log(colorValue);
    line.color = color;
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
