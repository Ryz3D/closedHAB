const express = require("express");
const { log, warn, error } = require("../out");

// executes update script over ssh when new docker image is pushed (https://docs.docker.com/docker-hub/webhooks/)
// make sure that
//  - the container is reachable on the webhook port (default 3001) by dockerhub (set up port forwarding)
//  - the host has the deamon running on port 2375 (/lib/docker/)

var ctx;
var app, listener;
var updating = false;

var fetch;
import("node-fetch")
    .then(mod => {
        fetch = mod.default;
    });

function docker(method, cmd, body = undefined, statusStream = false) {
    return new Promise(resolve => {
        fetch(`http://${ctx.setup.host}:${ctx.setup.port || 2375}/${cmd}`, {
            method,
            headers: {
                "Accept": "*/*",
                "Content-Type": body ? "application/json" : undefined,
            },
            body,
        })
            .then(async res => {
                const resText = await res.text();
                if (res.status >= 200 && res.status <= 299) {
                    log("docker-cd: Done!");
                    if (statusStream) {
                        var lastStatus;
                        res.body.on("data", d => {
                            const status = (JSON.parse(d.toString("utf-8")) || {}).status;
                            if (status !== lastStatus) {
                                log(`docker-cd: Status: ${status}`);
                            }
                        });
                    }
                    resolve(true);
                }
                else {
                    error(`docker-cd: Docker API call failed: ${(JSON.parse(resText) || {}).message}`);
                    resolve(false);
                }
            })
            .catch(e => error(`docker-cd: Docker API call failed: ${e}`));
    });
}

async function doUpdate() {
    const image = `mircoheitmann/closedhab:${ctx.setup.tag || "latest"}`;
    const container = ctx.setup.containerName || "closedhab";
    var success;

    log("docker-cd: Pulling new image...");
    success = await docker("POST", `images/create?fromImage=${image}`, undefined, true);
    if (!success) return;
    log("docker-cd: Stopping and removing old container...");
    success = await docker("DELETE", `containers/${container}?force=true`);
    if (!success) return;
    log("docker-cd: Creating container...");
    success = await docker("POST", `containers/create?name=${container}`, JSON.stringify({
        Image: image,
        ...(ctx.setup.container || {}),
    }));
    if (!success) return;
    log("docker-cd: Starting container...");
    await docker("POST", `containers/${container}/start`);
}

function run(c) {
    ctx = c;

    app = express();

    app.use(express.json());
    app.post("/closedhab-cd", (req, res) => {
        if (req.callback_url) {
            fetch(req.body.callback_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ state: "success" }),
            });
        }
        var passedCheck = true;
        if (ctx.setup.tag) {
            passedCheck = (req.body.push_data || {}).tag === ctx.setup.tag;
        }
        if (passedCheck && !updating) {
            doUpdate();
        }
        res.json({});
    });

    updating = false;

    app.on("error", e => error(`docker - cd: Server failed: ${e}`));
    const port = ctx.setup.port || 3001;
    listener = app.listen(port, _ => {
        log(`docker - cd: Listening on port ${port}`);
    }).on("error", e => error(`docker - cd: Can't start server: ${e}`));
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
