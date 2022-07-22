import './style.css';

const canvasSketch = require('canvas-sketch');
const SimplexNoise = require('simplex-noise');
const FastPoissonDiskSampling = require('fast-2d-poisson-disk-sampling');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const lineclip = require('lineclip');
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
    0.5,
    0.25,
    0.125,
    0,
    0,
];
const probs = [
    0.8,
    0.9,
    0.95,
    0.975,
    0.99,
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
const stepDistance = 8;
const maxSteps = 20;
const minSteps = 2;
const damping = 0.1;
const lineWidth = 4;
const margin = 16;
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

            // let sum = 0;
            // for (let i = 0; i < weights.length - 1; i++)
            // {
            //     sum += (weights[i]);
            //     probs[i] = sum;
            // }
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

            if (stepsTaken > 0) // TODO: remove?
            {
                // Create margin lines
                lines.forEach((line) =>
                {
                    drawLine(context, line.points, margin, '#ffffff');
                });
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
                line.clippedPoints = line.points.map(function(lineB)
                {
                    return lineclip(lineB, clipBox);
                }).reduce(function(a, b)
                {
                    return a.concat(b);
                }, []);
                console.log(line);
                if (line.clippedPoints.length > 2)
                {
                    setColor(line, width, height);
                    drawLine(context, line.clippedPoints, lineWidth, line.color);
                }
                else lines.splice(index, 1);
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
    // Calculate noise based value 0 - 1
    const noiseValue = Math.abs(simplex.noise2D(line.x / width * scale,
    line.y / height * scale) * turbulence);

    // Calculate random variation
    // let index = 0;
    // for (let i = 0; line.seed > probs[i]; i++)
    // {
    //     index = i;
    // }
    // const randomValue = index / probs.length;
    const randomValue = 0;

    // Combined value clamped 0 - 1
    const colorValue = clamp((noiseValue + randomValue), 0, 1);
    // Color selected by combined value
    line.color = colors[Math.floor(colorValue * colors.length)];
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

function randomInRange(min, max)
{
    return Math.random() * (max - min) + min;
}

function clamp(current, min, max)
{
    return Math.min(Math.max(current, min), max);
}

// function mapRange(value, inMin, inMax, outMin, outMax)
// {
//     return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
// }

canvasSketch(sketch, settings);
