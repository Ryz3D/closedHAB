const http = require("http");
const fs = require("fs");
const express = require("express");
const { log, warn, error } = require("../../out");

/*

TODO:
    - sse auth
    - websocket api

*/

var ctx;
var app, listener;
var startRetries;

function checkAuth(req, res) {
    if (ctx.setup.auth) {
        const result = req.headers.authorization === ctx.setup.auth;
        if (!result) {
            res.sendStatus(403);
        }
        return result;
    }
    else {
        return true;
    }
}

function cors(req, res) {
    if (ctx.setup.cors) {
        if (ctx.setup.cors === "echo") {
            res.set("Access-Control-Allow-Origin", req.headers.origin);
        }
        else {
            res.set("Access-Control-Allow-Origin", ctx.setup.cors);
        }
        res.set("Access-Control-Allow-Headers", ["Authorization"]);
        res.set("Access-Control-Allow-Credentials", "true");
    }
}

function options(req, res) {
    cors(req, res);
    res.end();
}

function run(c) {
    ctx = c;
    startRetries = 0;

    var layoutDir = ctx.setup.layoutDir || "addons/close/layouts/";
    if (!layoutDir.endsWith("/") && !layoutDir.endsWith("\\")) {
        layoutDir += "/";
    }

    const varForwConvs = {};
    const varBackConvs = {};
    for (var r of ctx.setup.converters) {
        varForwConvs[r.var] = [];
        for (var c of r.forwardConverters || []) {
            const idBuf = c.id;
            const setupBuf = { ...(c.setup || {}) };
            varForwConvs[r.var].push(v => require(`./${idBuf}.js`).convert(v, setupBuf));
        }
        varBackConvs[r.var] = [];
        for (var c of r.backwardConverters || []) {
            const idBuf = c.id;
            const setupBuf = { ...(c.setup || {}) };
            varBackConvs[r.var].push(v => require(`./${idBuf}.js`).convert(v, setupBuf));
        }
    }

    app = express();

    app.options("/api/layout/list", options);
    app.options("/api/layout/get", options);
    app.options("/api/var/list", options);
    app.options("/api/var/get", options);
    app.options("/api/var/set", options);
    app.options("/api/var/sub", options);
    app.options("/api/setup", options);

    app.get("/api/layout/list", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        fs.opendir(layoutDir, (e, dir) => {
            if (e) {
                warn(`close: /api/layout/list failed: ${e}`);
                res.json({ error: 1, message: e.toString() });
            }
            else {
                var layouts = [];
                try {
                    while (f = dir.readSync()) {
                        if (f.isFile() && f.name.endsWith(".json")) {
                            layouts.push(f.name.slice(0, -5));
                        }
                    }
                    dir.closeSync();
                    res.json({ error: 0, data: layouts });
                }
                catch (e) {
                    warn(`close: /api/layout/list failed: ${e}`);
                    res.json({ error: 1, message: e.toString() });
                }
            }
        });
    });
    app.get("/api/layout/get", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        if (req.query.q) {
            const path = `${layoutDir}${decodeURIComponent(req.query.q).replace(/[^\w/_]/g, "")}.json`;
            try {
                fs.readFile(path, (e, data) => {
                    if (e) {
                        warn(`close: /api/layout/get couldn't read file "${path}": ${e}`);
                        res.json({ error: 1, message: e.toString() });
                    }
                    else {
                        res.json({ error: 0, data: JSON.parse(data.toString()) });
                    }
                });
            }
            catch (e) {
                warn(`close: /api/layout/get couldn't read file "${path}": ${e}`);
                res.json({ error: 1, message: e.toString() });
            }
        }
        else {
            warn("close: /api/layout/get needs ?q query for layout path");
            res.json({ error: 1, message: "need ?q query for layout path" });
        }
    });
    app.get("/api/var/list", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        res.json({ error: 0, data: ctx.listVars().map(v => v.id) });
    });
    app.get("/api/var/get", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        res.set("Access-Control-Allow-Origin", "*");
        if (req.query.q) {
            const id = decodeURIComponent(req.query.q).replace(/[^\w/_]/g, "");
            const vr = ctx.findVar(id);
            if (vr) {
                if (vr.initialized) {
                    var data = vr.read();
                    for (var f of varBackConvs[vr.id] || []) {
                        data = f(data);
                    }
                    res.json({ error: 0, data });
                }
                else {
                    res.json({ error: 1, message: "uninitialized" });
                }
            }
            else {
                warn(`close: /api/var/get can't find var "${id}"`);
                res.json({ error: 1, message: "not found" });
            }
        }
        else {
            warn("close: /api/var/get needs ?q query for id");
            res.json({ error: 1, message: "need ?q query for id" });
        }
    });
    app.get("/api/var/set", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        if (req.query.q && req.query.v) {
            const id = decodeURIComponent(req.query.q).replace(/[^\w/_]/g, "");
            var val = decodeURIComponent(req.query.v);
            const vr = ctx.findVar(id);
            if (vr) {
                for (var f of varForwConvs[vr.id] || []) {
                    val = f(val);
                }
                vr.send(val);
                res.json({ error: 0 });
            }
            else {
                warn(`close: /api/var/set can't find var "${id}"`);
                res.json({ error: 1, message: "not found" });
            }
        }
        else {
            warn("close: /api/var/set needs ?q query for id and ?v for value");
            res.json({ error: 1, message: "need ?q query for id and ?v for value" });
        }
    });
    app.get("/api/var/sub", (req, res) => {
        cors(req, res);
        /*
        if (!checkAuth(req, res)) {
            return;
        }
        */
        if (req.query.q) {
            const id = decodeURIComponent(req.query.q).replace(/[^\w/_]/g, "");
            const vr = ctx.findVar(id);
            if (vr) {
                res.contentType("text/event-stream");
                res.flushHeaders();
                const subClose = vr.sub(val => {
                    for (var f of varBackConvs[vr.id] || []) {
                        val = f(val);
                    }
                    res.write(`data: ${val}\n\n`);
                });
                req.on("close", subClose);
            }
            else {
                warn(`close: /api/var/sub can't find var "${id}"`);
                res.json({ error: 1, message: "not found" });
            }
        }
        else {
            warn("close: /api/var/sub needs ?q query for id");
            res.json({ error: 1, message: "need ?q query for id" });
        }
    });
    app.get("/api/setup", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        res.json({ error: 0, data: ctx.setup.frontend || {} });
    });

    app.use("/", express.static("addons/close/public"));
    app.use((req, res, next) => {
        res.statusCode = 404;
        if (req.path.startsWith("/api/")) {
            cors(req, res);
            res.json({ error: 1, message: "not found" });
        }
        else {
            res.redirect("/");
        }
    });

    app.on("error", e => error(`close: Server failed: ${e}`));
    const port = ctx.setup.port || 8080;
    listener = app.listen(port, _ => {
        log(`close: Listening on port ${port}`);
    }).on("error", e => error(`close: Can't start server: ${e}`));
}

function stop() {
    return new Promise(resolve => {
        listener.close();
        app.emit("close");
        setTimeout(resolve, 1000);
    });
}

module.exports = {
    run,
    stop,
};
