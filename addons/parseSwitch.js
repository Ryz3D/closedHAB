const { log, warn, error } = require("../out");

function convert(value, setup = {}) {
    if (value === null || value === undefined) {
        error("parseSwitch: Received null or undefined value");
        return setup.back ? "OFF" : 0;
    }
    if (setup.back) {
        return value === 1 ? "ON" : "OFF";
    }
    else {
        return value.toString().toUpperCase() === "ON" ? 1 : 0;
    }
}

module.exports = {
    convert
};
