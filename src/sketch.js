// Based on flow-field by Varun Vachhar
// https://github.com/winkerVSbecks/sketchbook/blob/master/flow-field.js

import { LineLoop } from 'three';
import './style.css';

const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const FastPoissonDiskSampling = require('fast-2d-poisson-disk-sampling');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
// const { mapRange } = require('canvas-sketch-util/math');
// const lerp = require('lerp');
const simplex = new SimplexNoise();
const poisson = new FastPoissonDiskSampling({
    shape: [window.innerWidth, window.innerHeight],
    radius: 150,
    tries: 20,
});

// class Rectangle
// {
//     constructor(x, y, w, h)
//     {
//         this.x = x;
//         this.y = y;
//         this.w = w;
//         this.h = h;
//     }
// }

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
                        if (checkProximity(line.x, line.y, lines) === true)
                        {
                            extendLine(line, width, height);
                        }
                        else
                        {
                            // console.log('too close!');
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
            });
            stepsTaken++;
        },
    };
};

canvasSketch(sketch, settings);

function checkProximity(x, y, lines)
{
    // For each point in the vicinity
    // lines.forEach((p) =>
    // {
    //     // If distance between [x,y] and point > minDistance return true
    // });
    const pointX = window.innerWidth / 2;
    const pointY = window.innerHeight / 2;

    const distance = getDistance(x, y, pointX, pointY);
    if (distance > minDistance)
    {
        return true;
    }
}

function getDistance(x1, y1, x2, y2)
{
    const x = x2 - x1;
    const y = y2 - y1;
    return Math.sqrt(x * x + y * y);
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
