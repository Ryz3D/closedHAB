const express = require("express");
const { log, warn, error } = require("../out");

var ctx;
var app, listener;
const publicDir = "./addons/close/";

function checkAuthText(text) {
    if (ctx.setup.users) {
        const result = (ctx.setup.users || []).findIndex(u => u.auth === text);
        if (result === -1) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return true;
    }
}

function checkAuth(req, res) {
    if (checkAuthText(req.headers.authorization)) {
        return true;
    }
    else {
        res.sendStatus(403);
        return false;
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

    const varForwConvs = {};
    const varBackConvs = {};
    for (var e of Object.entries(ctx.setup.converters)) {
        varForwConvs[e[0]] = [];
        for (var c of Object.values(e[1].forwardConverters || {})) {
            const idBuf = c.id;
            const ctxBuf = { ...ctx, setup: c.setup || {} };
            varForwConvs[e[0]].push(v => require(`./${idBuf}.js`).convert(v, ctxBuf));
        }
        varBackConvs[e[0]] = [];
        for (var c of Object.values(e[1].backwardConverters || {})) {
            const idBuf = c.id;
            const ctxBuf = { ...ctx, setup: c.setup || {} };
            varBackConvs[e[0]].push(v => require(`./${idBuf}.js`).convert(v, ctxBuf));
        }
    }

    app = express();

    app.options("/api/layout/list", options);
    app.options("/api/layout/get", options);
    app.options("/api/layout/home", options);
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
        res.json({ error: 0, data: Object.keys(ctx.setup.layouts) });
    });
    app.get("/api/layout/get", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        if (req.query.q === undefined) {
            res.json({ error: 1, message: "need ?q query for layout path" });
        }
        else {
            const id = decodeURIComponent(req.query.q);
            if (ctx.setup.layouts[id] === undefined) {
                res.json({ error: 1, message: `layout "${id}" not found` });
            }
            else {
                res.json({ error: 0, data: ctx.setup.layouts[id] });
            }
        }
    });
    app.get("/api/layout/home", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        const altID = Object.keys(ctx.setup.layouts)[0];
        if (altID === undefined) {
            res.json({ error: 1, message: `no layouts defined` });
        }
        else {
            if (ctx.setup.users === undefined) {
                res.json({ error: 0, data: altID });
            }
            else {
                const user = (ctx.setup.users || []).findIndex(u => u.auth === req.headers.authorization);
                if (user === -1) {
                    res.json({ error: 0, data: altID });
                }
                else {
                    if (ctx.setup.users[user].home === undefined) {
                        res.json({ error: 0, data: altID });
                    }
                    else {
                        res.json({ error: 0, data: ctx.setup.users[user].home });
                    }
                }
            }
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
        if (req.query.q) {
            const id = decodeURIComponent(req.query.q);
            const vr = ctx.findVar(id);
            if (vr === undefined) {
                res.json({ error: 1, message: `var "${id}" not found` });
            } else {
                if (vr.initialized) {
                    var data = vr.read();
                    if (data === undefined) {
                        res.json({ error: 1, message: "undefined" });
                    }
                    else {
                        for (var f of varBackConvs[vr.id] || []) {
                            data = f(data);
                        }
                        res.json({ error: 0, data });
                    }
                }
                else {
                    res.json({ error: 1, message: "uninitialized" });
                }
            }
        }
        else {
            res.json({ error: 1, message: "need ?q query for id" });
        }
    });
    app.get("/api/var/set", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        if (req.query.q === undefined || req.query.v === undefined) {
            res.json({ error: 1, message: "need ?q query for id and ?v for value" });
        }
        else {
            const id = decodeURIComponent(req.query.q);
            var val = decodeURIComponent(req.query.v);
            const vr = ctx.findVar(id);
            if (vr) {
                for (var f of varForwConvs[vr.id] || []) {
                    val = f(val);
                }
                vr.send(val, req.query.f);
                res.json({ error: 0 });
            }
            else {
                res.json({ error: 1, message: "not found" });
            }
        }
    });
    app.get("/api/var/sub", (req, res) => {
        cors(req, res);
        // default js eventstream doesn't support auth header :(
        if (!checkAuthText(decodeURIComponent(req.query.a))) {
            res.sendStatus(403);
        }
        else {
            res.contentType("text/event-stream");
            res.flushHeaders();
            const subClosers = [];
            for (var v of ctx.listVars()) {
                const idBuf = v.id;
                subClosers.push(v.sub(val => {
                    if (val !== undefined) {
                        for (var f of varBackConvs[idBuf] || []) {
                            val = f(val);
                        }
                        res.write(`event: ${idBuf}\ndata: ${val}\n\n`);
                    }
                }));
            }
            req.on("close", _ => {
                for (var f of subClosers) {
                    f();
                }
            });
        }
    });
    app.get("/api/setup", (req, res) => {
        cors(req, res);
        if (!checkAuth(req, res)) {
            return;
        }
        res.json({ error: 0, data: ctx.setup.frontend || {} });
    });

    app.use("/", express.static(publicDir));
    app.use((req, res) => {
        res.statusCode = 404;
        if (req.path.startsWith("/api/")) {
            cors(req, res);
            res.json({ error: 1, message: "not found" });
        }
        else {
            if (ctx.setup.notFoundPath) {
                res.redirect(ctx.setup.notFoundPath);
            }
            else {
                res.statusCode = 404;
                res.send("Not Found");
            }
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
