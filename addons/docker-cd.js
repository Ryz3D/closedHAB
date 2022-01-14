const express = require("express");
const { log, warn, error } = require("../out");
const { exec } = require("child_process");

// executes update script over ssh when new docker image is pushed (https://docs.docker.com/docker-hub/webhooks/)
// make sure that
//  - the container is reachable on the webhook port (default 3001) by dockerhub (set up port forwarding)
//  - the destination (typically docker host) is reachable on ssh and keys are exchanged
//  - the pull.sh script exists (example below) and set up as "command" with full path

/* pull.sh example

#!/bin/bash
cd /usr/src/closedhab
docker-compose pull && docker-compose down && docker-compose up -d

*/

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
            passedCheck = req.body.push_data.tag === ctx.setup.tag;
        }
        if (passedCheck && !updating) {
            log("docker-cd: New Image, prepare for update.");
            exec(`ssh ${ctx.setup.destination || "localhost"} ${ctx.setup.command || "./pull.sh"}`, (error, stdout, stderr) => {
                if (error) {
                    error(`docker-cd: exec: ${error}`);
                }
                if (stderr) {
                    error(`docker-cd: exec: ${stderr}`);
                }
                log(`docker-cd: exec: ${stdout}`);
            });
            updating = true;
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
