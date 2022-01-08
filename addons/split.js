const { log, warn, error } = require("../out");

function convert(value, setup) {
    try {
        const split = value.split(setup.sep || ",");
        if (typeof setup.index === "number") {
            if (setup.index >= 0 && setup.index < split.length) {
                return split[setup.index];
            }
            else {
                error(`split: Index ${setup.index} out of range for "${value}"`);
            }
        }
        else {
            return split[0];
        }
    }
    catch (e) {
        error(`split: Failed to split "${value}": ${e}`);
    }
}

module.exports = {
    convert
};
