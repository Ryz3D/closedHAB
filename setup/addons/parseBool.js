const { log, warn, error } = require("../../out");

function convert(value, setup = {}) {
    if (value === null || value === undefined) {
        error("parseBool: Received null or undefined value");
        return setup.back ? false : 0;
    }
    if (setup.back) {
        return value === 1;
    }
    else {
        return value ? 1 : 0;
    }
}

module.exports = {
    convert
};
