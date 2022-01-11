const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    if (typeof value === "string") {
        return undefined;
    }
    else {
        return value;
    }
}

module.exports = {
    convert
};
