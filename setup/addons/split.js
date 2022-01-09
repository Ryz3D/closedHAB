const { log, warn, error } = require("../../out");

function applyConverters(value, mappers) {
    var val = value;
    for (var m of mappers) {
        val = require(`./${m.id}.js`).convert(val, m.setup || {});
    }
    return val;
}

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
        else if (setup.mappers !== undefined) {
            return split.map(v => applyConverters(v, setup.mappers));
        }
        else {
            return split[0];
        }
    }
    catch (e) {
        error(`split: Failed to process "${value}": ${e}`);
    }
}

module.exports = {
    convert
};
