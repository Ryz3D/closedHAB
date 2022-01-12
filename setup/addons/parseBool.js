const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    if (value === null || value === undefined) {
        error("parseBool: Received null or undefined value");
        return ctx.setup.back ? false : 0;
    }
    if (ctx.setup.back) {
        return value >= 0.5;
    }
    else {
        if (typeof value === "string") {
            return value.toLowerCase() === "true" ? 1 : 0;
        }
        else {
            return value ? 1 : 0;
        }
    }
}

module.exports = {
    convert
};
