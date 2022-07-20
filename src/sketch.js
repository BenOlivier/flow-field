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
    '#089f8f',
    '#00898a',
    '#08737f',
    '#215d6e',
    '#2a4858',
];

// Sketch settings
const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const padding = 100;
const numIterations = 0;
const stepDistance = 8;
const numSteps = 10;
const minLength = 2;
const damping = 0.1;
const lineWidth = 3;
const margin = 15;
const scale = 1;
const turbulence = 1;

const sketch = () =>
{
    let stepsTaken = 0;
    let iteration = 1;

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
                if (iteration < numIterations)
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
                    iteration++;
                }
            }

            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = '#fffee0';
            context.fillRect(0, 0, width, height);

            // Draw new lines
            const polylines = lines.map((line) => line.points);
            const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);
            drawLines(context, polylines, lineWidth, false);

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
        const color = setColor(startPoints[i][0], startPoints[i][1]);

        lines.push({
            x: startPoints[i][0],
            y: startPoints[i][1],
            velocityX: 0,
            velocityY: 0,
            points: [[startPoints[i][0], startPoints[i][1]]],
            color: color,
        });
    }
    // Discard poisson array
    startPoints = poisson.reset();
}

function setColor(x, y)
{
    // const noiseValue = ((simplex.noise2D(x / window.innerWidth * scale,
    //     y / window.innerHeight * scale) * turbulence) + 1) / 2;
    const noiseValue = Math.abs(simplex.noise2D(x / window.innerWidth * scale,
        y / window.innerHeight * scale) * turbulence);
    return colors[Math.floor(noiseValue * colors.length)];
}

function drawLines(context, clippedLines, width, margin)
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
        if (!margin) context.strokeStyle = lines[index].color;
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

canvasSketch(sketch, settings);
