const { log, warn, error } = require("../../out");

function convert(value, setup) {
    if (setup.factor !== undefined) {
        return value * setup.factor;
    }
    else if (setup.quotient !== undefined) {
        return value / setup.quotient;
    }
    else {
        error(`scale: No factor of divider given`)
    }
}

module.exports = {
    convert
};
