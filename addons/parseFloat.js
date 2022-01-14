const { log, warn, error } = require("../out");

function convert(value, ctx) {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        if (ctx.setup.allowString && typeof value === "string") {
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
