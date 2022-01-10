const { ClosedVar, ClosedChannel, ClosedEvent } = require("../../base");
const { log, warn, error } = require("../../out");

var ctx;
const vars = [];

function run(c) {
    ctx = c;
}

function stop() {
    return new Promise(resolve => {
        for (var v of vars) {
            ctx.unregisterVar(v.id);
        }
        resolve();
    });
}

function register(id, setup = {}) {
    const vr = new ClosedVar(id);
    ctx.registerVar(vr);
    vars.push(vr);
    vr.sub(d => {
        // new data from server
        ctx.back(id, d);
    });
    // add listener, send new data from addon
    vr.send(ctx.forw(id, 0));
}

module.exports = {
    run,
    stop,
    register,
};
