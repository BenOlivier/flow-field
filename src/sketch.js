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
    radius: 50,
    tries: 20,
});

const colors = {
    red: '#da3900',
    blue: '#5555ff',
    black: '#111111',
    white: '#ffffff',
};

// Sketch settings
const settings = {
    animate: true,
    duration: 5,
    loop: false,
};

const padding = 100;
const stepDistance = 10;
const numSteps = 50;
// const minLength = 10;
const damping = 0.1;
const lineWidth = 5;
const margin = 20;
const scale = 1;

const sketch = () =>
{
    const lines = [];
    let stepsTaken = 0;

    return {
        begin()
        {
            // Generate evenly distributed starting points
            const startingPoints = poisson.fill();
            // Fill lines array with line objects
            for (let i = 0; i < startingPoints.length; i++)
            {
                lines.push({
                    x: startingPoints[i][0],
                    y: startingPoints[i][1],
                    velocityX: 0,
                    velocityY: 0,
                    points: [],
                    color: colors.white,
                });
            }
            // Discard poisson array
            startingPoints.length = 0;
        },
        render({ context, width, height, playhead })
        {
            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = colors.black;
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
                // Clip lines to box
                const polylines = lines.map((line) => line.points);
                const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);

                drawLines(context, clippedLines, margin);
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

            // Clear canvas and fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = colors.black;
            context.fillRect(0, 0, width, height);

            // Draw new lines
            const polylines = lines.map((line) => line.points);
            const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);
            drawLines(context, clippedLines, lineWidth);

            stepsTaken++;
        },
    };
};

function drawLines(context, clippedLines, width)
{
    context.lineWidth = width;
    clippedLines.forEach((line) =>
    {
        const [start, ...pts] = line;
        // Lines
        context.beginPath();
        context.moveTo(...start);
        pts.forEach((pt) =>
        {
            context.lineTo(...pt);
        });
        context.strokeStyle = colors.white;
        context.stroke();
    });
}

function extendLine(line, width, height)
{
    // Calculate noise value at position
    const value = simplex.noise2D(line.x / width * scale,
        line.y / height * scale);

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
    const pixelData = context.getImageData(x, y, 1, 1).data;
    console.log(pixelData);

    if (pixelData[0] !== 255)
    {
        return true;
    }
    else
    {
        console.log('too close!');
    }
}

canvasSketch(sketch, settings);
