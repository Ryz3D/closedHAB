const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    if (ctx.setup.factor !== undefined) {
        value *= ctx.setup.factor;
    }
    if (ctx.setup.quotient !== undefined) {
        value /= ctx.setup.quotient;
    }
    return value;
}

module.exports = {
    convert
};
