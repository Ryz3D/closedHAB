const { log, warn, error } = require("../../out");

function convert(value, setup) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        if (setup.allowString && typeof value === "string") {
            return value;
        }
        else {
            error(`parseFloat: Can't parse "${value}"`);
            return 0;
        }
    }
    else {
        return parsed;
    }
}

module.exports = {
    convert
};
