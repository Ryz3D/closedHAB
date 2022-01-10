const { log, warn, error } = require("../../out");

var ctx;

function applyConverters(value, mappers) {
    var val = value;
    for (var m of mappers) {
        val = require(`./${m.id}.js`).convert(val, { ...ctx, setup: m.setup || {} });
    }
    return val;
}

function convert(value, c) {
    ctx = c;

    try {
        const split = value.split(ctx.setup.sep || ",");
        if (typeof ctx.setup.index === "number") {
            if (ctx.setup.index >= 0 && ctx.setup.index < split.length) {
                return split[ctx.setup.index];
            }
            else {
                error(`split: Index ${ctx.setup.index} out of range for "${value}"`);
            }
        }
        else if (ctx.setup.mappers !== undefined) {
            return split.map(v => applyConverters(v, ctx.setup.mappers));
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
