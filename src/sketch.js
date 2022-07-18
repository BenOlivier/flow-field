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
    radius: 150,
    tries: 20,
});

const hiddenCanvas = document.createElement('canvas');
Object.assign(hiddenCanvas.style, {
    position: 'absolute',
    width: '100%',
    height: '100%',
});
document.body.appendChild(hiddenCanvas);
const hiddenContext = hiddenCanvas.getContext('2d');

// Lookup the size the browser is displaying the canvas in CSS pixels. //TODO: Do on resize
const displayWidth = hiddenCanvas.clientWidth;
const displayHeight = hiddenCanvas.clientHeight;
// Check if the canvas is not the same size.
const needResize = hiddenCanvas.width !== displayWidth ||
    hiddenCanvas.height !== displayHeight;
if (needResize)
{
    // Make the canvas the same size
    hiddenCanvas.width = displayWidth;
    hiddenCanvas.height = displayHeight;
}

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
const damping = 0.1;
const lineWidth = 5;
const minDistance = 50;

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
            // Clear canvas then fill background
            context.clearRect(0, 0, width, height);
            context.fillStyle = colors.black;
            context.fillRect(0, 0, width, height);
            // Clear hidden canvas
            hiddenContext.clearRect(0, 0, width, height);
            hiddenContext.fillStyle = '#ffffff';
            hiddenContext.fillRect(0, 0, width, height);

            // If steps are not complete
            if (stepsTaken < numSteps)
            {
                let index = 0;
                lines.forEach((line) =>
                {
                    // If this line has not been stopped
                    if (line.points.length === stepsTaken)
                    {
                        // If the current position is not to close to other points
                        if (checkProximity(line.x, line.y) === true)
                        {
                            extendLine(line, width, height);
                        }
                        else
                        {
                            console.log('too close!');
                        }
                    }
                    if (line.points.length === 0) // TODO: Delete
                    {
                        lines.splice(index, 1);
                    }
                    index++;
                });
            }

            // Define clip box
            const clipBox = [
                [padding, padding],
                [width - padding, height - padding],
            ];
            // Clip lines to box
            const polylines = lines.map((line) => line.points);
            const clippedLines = clipPolylinesToBox(polylines, clipBox, false, false);

            context.lineWidth = lineWidth;
            context.lineJoin = 'round';
            context.lineCap = 'round';

            // Draw lines
            clippedLines.forEach((line, index) =>
            {
                const [start, ...pts] = line;

                context.beginPath();
                context.moveTo(...start);
                pts.forEach((pt) =>
                {
                    context.lineTo(...pt);
                });
                context.strokeStyle = lines[index].color;
                context.stroke();

                // Thick lines
                hiddenContext.beginPath();
                hiddenContext.moveTo(...start);
                pts.forEach((pt) =>
                {
                    hiddenContext.lineTo(...pt);
                });
                hiddenContext.lineWidth = 50;
                hiddenContext.strokeStyle = '#000000';
                hiddenContext.lineJoin = 'round';
                hiddenContext.lineCap = 'round';
                hiddenContext.stroke();
            });
            stepsTaken++;
        },
    };
};

canvasSketch(sketch, settings);

function checkProximity(x, y)
{
    const pixelData = hiddenContext.getImageData(x, y, 1, 1).data;
    console.log(pixelData);

    if (pixelData[0] === 255)
    {
        return true;
    }
}

function extendLine(line, width, height)
{
    // Calculate noise value at position
    const value = simplex.noise2D(line.x / width, line.y / height);

    // Update the velocity of the particle
    line.velocityX += Math.cos(value) * stepDistance;
    line.velocityY += Math.sin(value) * stepDistance;

    // Move the particle
    line.x += line.velocityX;
    line.y += line.velocityY;

    // Use damping to slow down the particle (think friction)
    line.velocityX *= damping;
    line.velocityY *= damping;

    line.points.push([line.x, line.y]);
}
