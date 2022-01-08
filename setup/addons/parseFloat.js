const { log, warn, error } = require("../../out");

function convert(value, setup) {
    try {
        return parseFloat(value);
    }
    catch (e) {
        error(`parseFloat: Can't parse "${value}"`);
        return 0;
    }
}

module.exports = {
    convert
};
