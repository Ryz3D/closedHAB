const { log, warn, error } = require("../out");

function convert(value, ctx) {
    if (value === null || value === undefined) {
        error("parseSwitch: Received null or undefined value");
        return ctx.setup.back ? "OFF" : 0;
    }
    if (ctx.setup.back) {
        return value >= 0.5 ? "ON" : "OFF";
    }
    else {
        return value.toString().toUpperCase() === "ON" ? 1 : 0;
    }
}

module.exports = {
    convert
};
