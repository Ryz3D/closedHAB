const { log, warn, error } = require("../out");

function convert(value, setup) {
    const roundFactor = 10 ** (setup.precision || 0);
    return Math.round((value + Number.EPSILON) * roundFactor) / roundFactor
}

module.exports = {
    convert
};
