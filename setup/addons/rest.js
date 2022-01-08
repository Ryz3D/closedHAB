const { ClosedVar, ClosedChannel, ClosedEvent } = require("../../base");
const { log, warn, error } = require("../../out");
const http = require("http");

/*

TODO:
    - http events (keep alive connections)
    - http streams -"- (channels)

*/

const defaultSetup = {
    "headers": undefined,
    "get": "",
    "getMethod": "GET",
    "set": "",
    "setMethod": "GET",
    "interval": 5000,
    "timeout": 2000,
    "verbose": false,
    "body": "{}",
    "placeholder": "{}",
    "encoding": "utf-8",
};

var ctx;
const vars = [];
var intervals = [];

function setupOption(id, varSetup) {
    return varSetup[id] || ctx.setup[id] || defaultSetup[id];
}

function rest(id, setup, data, urlId, methodId, cb) {
    const req = http.request(setupOption(urlId, setup).replace(setupOption("placeholder", setup), data), {
        headers: setupOption("headers", setup),
        timeout: setupOption("timeout", setup),
        method: setupOption(methodId, setup),
    }, res => {
        res.on("error", e => {
            error(`REST: Connection to "${setupOption(urlId, setup)}" for "${id}" failed: ${e}`);
        });
        res.on("data", resBody => {
            if (res.statusCode === 200) {
                cb(resBody.toString(setupOption("encoding", setup)));
            }
            else {
                error(`REST: "${setupOption(urlId, setup)}" failed for "${id}" with HTTP ${res.statusCode}: "${resBody}"`);
            }
        });
    });
    req.on("error", e => {
        error(`REST: Connection to "${setupOption(urlId, setup)}" for "${id}" failed: ${e}`);
    });
    req.on("timeout", _ => {
        req.destroy();
    });
    if (setupOption(methodId, setup).toUpperCase() !== "GET") {
        req.write(setupOption("body", setup).replace(setupOption("placeholder", setup), data), setupOption("encoding", setup));
    }
    req.end();
}

function run(c) {
    ctx = c;
}

function stop() {
    return new Promise(resolve => {
        for (var i of intervals) {
            clearInterval(i);
        }
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
    vr.sub(data => {
        if (setupOption("verbose", setup)) {
            log(`REST: Setting "${id}" to "${data}"`);
        }
        rest(id, setup, ctx.back(id, data), "set", "setMethod", res => {
            if (setupOption("verbose", setup)) {
                log(`REST: Got response for "${id}" set: "${res}"`);
            }
        });
    });
    intervals.push(setInterval(_ => {
        rest(id, setup, vr.initialized ? ctx.back(id, vr.read()) : "", "get", "getMethod", d => {
            vr.send(ctx.forw(id, d));
        });
    }, setupOption("interval", setup)));
}

module.exports = {
    run,
    stop,
    register,
};
