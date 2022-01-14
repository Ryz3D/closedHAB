const { log, warn, error } = require("../out");

function convert(value, ctx) {
    log(`converter log: ${value}`);
    return value;
}

module.exports = {
    convert
};
