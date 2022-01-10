const { log, warn, error } = require("../../out");

function convert(value, ctx) {
    const index = ctx.setup.index === undefined ? 0 : ctx.setup.index;
    const res = value[index];
    if (res === undefined) {
        error(`index: Can't get element [${index}] of "${value}"`);
        return 0;
    }
    else {
        return res;
    }
}

module.exports = {
    convert
};
