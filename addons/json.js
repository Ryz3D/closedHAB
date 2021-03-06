const { log, warn, error } = require("../out");

function convert(value, ctx) {
    try {
        var element = typeof value === "string" ? JSON.parse(value) : value;
        if (!ctx.setup.path) {
            return element;
        }
        else {
            for (var p of ctx.setup.path.split(".")) {
                if (element[p] !== undefined) {
                    element = element[p];
                }
                else {
                    error(`JSON: Can't find "${p}" in "${element}"`);
                    return;
                }
            }
            return element;
        }
    }
    catch (e) {
        error(`JSON: Can't parse: ${e} in "${value}"`);
    }
}

module.exports = {
    convert
};
