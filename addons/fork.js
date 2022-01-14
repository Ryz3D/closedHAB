const { log, warn, error } = require("../out");

var ctx;

function convert(value, c) {
    ctx = c;

    if (ctx.setup.to) {
        const vr = ctx.findVar(ctx.setup.to);
        if (vr === undefined) {
            warn(`fork: Var "${ctx.setup.to}" not found.`);
        }
        else {
            if (!ctx.setup.numOnly || !isNaN(value)) {
                vr.send(value);
            }
        }
    }

    return value;
}

module.exports = {
    convert
};
