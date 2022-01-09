const { ClosedVar, ClosedChannel, ClosedEvent } = require("../../base");
const { log, warn, error } = require("../../out");
const http = require("http");

const defaultSetup = {
    "server": "",
    "auth": "",
    "device": 0,
    "get": true,
    "set": true,
    "floatCheck": true,
    "class": "Basic",
    "readFunc": "Get()",
    "getFunc": "data.level.value",
    "setFunc": "Set({})",
    "placeholder": "{}",
    "headers": {},
    "interval": 10000,
    "timeout": 1000,
};

var ctx;
const vars = [];
var intervals = [];

function setupOption(id, varSetup) {
    if (varSetup[id] !== undefined) {
        return varSetup[id];
    }
    if (ctx.setup[id] !== undefined) {
        return ctx.setup[id];
    }
    return defaultSetup[id];
}

function formatServer(server) {
    return server + (server.endsWith("/") ? "" : "/");
}

function zwayRun(setup, command) {
    return new Promise(resolve => {
        const url = `${formatServer(setupOption("server", setup))}JS/Run/zway.${command}`;
        try {
            const req = http.request(url, {
                headers: {
                    Accept: "application/json, text/plain",
                    Authorization: setupOption("auth", setup),
                    ...setupOption("headers", setup)
                },
                timeout: setupOption("timeout", setup),
                method: "GET",
            }, res => {
                res.on("error", e => {
                    error(`ZWay: Connection to "${url}" failed: ${e}`);
                    resolve();
                });
                res.on("data", resBody => {
                    if (res.statusCode === 200) {
                        resolve(resBody.toString());
                    }
                    else {
                        error(`ZWay: "${url}" failed with HTTP ${res.statusCode}: "${resBody}"`);
                        resolve();
                    }
                });
            });
            req.on("error", e => {
                error(`ZWay: Connection to "${url}" failed: ${e}`);
                resolve();
            });
            req.on("timeout", _ => {
                req.destroy();
                resolve();
            });
            req.end();
        }
        catch (e) {
            error(`ZWay: Connection to "${url}" failed: ${e}`);
            resolve();
        }
    });
}

function zwayFunc(setup, func) {
    return zwayRun(setup, `devices[${setupOption("device", setup)}].${setupOption("class", setup)}.${func}`);
}

function zwayGet(setup) {
    return new Promise(resolve => {
        zwayFunc(setup, setupOption("readFunc", setup))
            .then(_ => zwayFunc(setup, setupOption("getFunc", setup)))
            .then(resolve);
    });
}

function zwaySet(setup, value) {
    if (typeof value === "string") {
        switch (value.toUpperCase()) {
            case "STOP":
                return zwayFunc(setup, "StopLevelChange()");
            case "UP":
                return zwayFunc(setup, "StartLevelChange(0)");
            case "DOWN":
                return zwayFunc(setup, "StartLevelChange(1)");
            default:
                break;
        }
    }
    return zwayFunc(setup, setupOption("setFunc", setup)
        .replace(setupOption("placeholder", setup), value));
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
    if (setupOption("set", setup)) {
        vr.sub(data => {
            zwaySet(setup, ctx.back(id, data));
        });
    }
    if (setupOption("get", setup)) {
        intervals.push(setInterval(_ => {
            zwayGet(setup)
                .then(d => {
                    if (d !== undefined && (!isNaN(d) || !setupOption("floatCheck", setup))) {
                        vr.send(ctx.forw(id, d));
                    }
                });
        }, setupOption("interval", setup)));
    }
}

module.exports = {
    run,
    stop,
    register,
};
