const { log, warn, error } = require("../out");

function convert(value, ctx) {
    if (ctx.setup.format === undefined) {
        error("combine: No format given");
        return value;
    }
    else {
        var res = "";
        for (var e of ctx.setup.format) {
            if (e.val) {
                res += value;
            }
            else if (e.str !== undefined) {
                res += e.str;
            }
            else if (e.var !== undefined) {
                const vr = ctx.findVar(e.var);
                if (vr === undefined) {
                    if (e.or === undefined) {
                        error(`combine: Can't find var "${e.var}"`);
                    }
                    else {
                        res += e.or;
                    }
                }
                else {
                    if (vr.initialized && !vr.blocked) {
                        const data = vr.read();
                        if (data !== undefined) {
                            res += vr.read();
                        }
                    }
                    else {
                        if (e.or === undefined) {
                            error(`combine: Can't add uninitialized var "${e.var}"`);
                        }
                        else {
                            res += e.or;
                        }
                    }
                }
            }
            else if (e.or !== undefined) {
                res += e.or;
            }
            else {
                error(`combine: Can't format ${e}`);
            }
        }
        return res;
    }
}

module.exports = {
    convert
};
