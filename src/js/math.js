function randomInRange(min, max)
{
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max)
{
    return Math.min(Math.max(value, min), max);
}

function mapRange(value, inMin, inMax, outMin, outMax)
{
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export { randomInRange, clamp, mapRange };
