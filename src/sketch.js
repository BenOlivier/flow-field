import './style.css';

const canvasSketch = require('canvas-sketch');
const lerp = require('lerp');
const SimplexNoise = require('simplex-noise');

const simplex = new SimplexNoise();

const settings = {
    animate: true,
    duration: 10,
};

const colors = {
    red: '#da3900',
    blue: '#e1e9ee',
    gray: ['#111111', '#757575', '#e9e9e9'],
    white: '#ffffff',
};

canvasSketch(() =>
{
    return ({ context, width, height, playhead }) =>
    {
        context.clearRect(0, 0, width, height);
        context.fillStyle = colors.gray[0];
        context.fillRect(0, 0, width, height);

        const padding = 100;
        const density = 40;
        const gridSize = [width / density, height / density];
        const tileSize = (width - padding * 2) / gridSize[0];
        const length = tileSize * 0.5;
        const thickness = 2;
        const time = Math.sin(playhead * 2 * Math.PI);

        for (let x = 0; x < gridSize[0]; x++)
        {
            for (let y = 0; y < gridSize[1]; y++)
            {
                // get a 0..1 UV coordinate
                const u = x / (gridSize[0] - 1);
                const v = y / (gridSize[1] - 1);

                // scale to dimensions with a border padding
                const t = {
                    x: lerp(padding, width - padding, u),
                    y: lerp(padding, height - padding, v),
                };

                // Draw
                context.save();
                context.fillStyle = colors.white;

                const rotation = simplex.noise3D(x / gridSize[0],
                    y / gridSize[1], time) * Math.PI;

                // Rotate in place
                context.translate(t.x, t.y);
                context.rotate(rotation);
                context.translate(-t.x, -t.y);

                // Draw the line
                context.fillRect(t.x, t.y - thickness, length, thickness);
                context.restore();
            }
        }
    };
}, settings);
