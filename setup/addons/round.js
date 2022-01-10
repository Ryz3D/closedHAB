const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    const roundFactor = 10 ** (ctx.setup.precision || 0);
    return Math.round((value + Number.EPSILON) * roundFactor) / roundFactor
}

module.exports = {
    convert
};
