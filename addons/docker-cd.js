const express = require("express");
const { log, warn, error } = require("../out");
const process = require("process");
const { pipeline } = require("stream");

// executes update script over ssh when new docker image is pushed (https://docs.docker.com/docker-hub/webhooks/)
// make sure that
//  - the container is reachable on the webhook port (default 3001) by dockerhub (set up port forwarding)
//  - the host has the deamon running on port 2375

var ctx;
var app, listener;
var updating = false;

var fetch;
import("node-fetch")
    .then(mod => {
        fetch = mod.default;
    });

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
            log("docker-cd: New Image, prepare for update.");
            fetch(`http://${ctx.setup.host}:${ctx.setup.port || 2375}/images/create?fromImage=mircoheitmann/closedhab:${ctx.setup.tag || "latest"}`, {
                method: "POST",
                headers: {
                    "Accept": "*/*",
                },
            })
                .then(res => {
                    if (res.status === 200) {
                        res.body.on("end", _ => {
                            log("docker-cd: Pull should be done now.");
                        })
                        res.body.on("error", e => {
                            error(`docker-cd: Failed to read docker response: ${e}`);
                        })
                        pipeline(res.body, process.stdout, (err) => {
                            if (err) {
                                error(err);
                            }
                        });
                    }
                    else {
                        error(`docker-cd: Docker API replied with ${res.status} ${res.statusText}`);
                    }
                })
                .catch(e => error(`docker-cd: Docker API call failed${e}`));
        }
        res.json({});
    });

    updating = false;

    app.on("error", e => error(`docker-cd: Server failed: ${e}`));
    const port = ctx.setup.port || 3001;
    listener = app.listen(port, _ => {
        log(`docker-cd: Listening on port ${port}`);
    }).on("error", e => error(`docker-cd: Can't start server: ${e}`));
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
