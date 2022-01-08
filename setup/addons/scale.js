const { log, warn, error } = require("../../out");

function convert(value, setup) {
    return value * setup.factor;
}

module.exports = {
    convert
};
