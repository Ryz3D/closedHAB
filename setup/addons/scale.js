const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    if (ctx.setup.factor !== undefined) {
        return value * ctx.setup.factor;
    }
    else if (ctx.setup.quotient !== undefined) {
        return value / ctx.setup.quotient;
    }
    else {
        error(`scale: No factor of divider given`)
    }
}

module.exports = {
    convert
};
