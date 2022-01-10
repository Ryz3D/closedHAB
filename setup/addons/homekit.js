const { ClosedVar, ClosedChannel, ClosedEvent } = require("../../base");
const { log, warn, error } = require("../../out");
const hap = require("hap-nodejs");

const defaultSetup = {
    "name": "closedHAB",
    "user": "CC:22:3D:E3:CE:31",
    "pin": "031-45-154",
    "port": 51826,
    "publish": {},
};

var ctx;
var acs;

function setupOption(id, varSetup = {}) {
    if (varSetup[id] !== undefined) {
        return varSetup[id];
    }
    if (ctx.setup[id] !== undefined) {
        return ctx.setup[id];
    }
    return defaultSetup[id];
}

function run(c) {
    ctx = c;

    acs = new hap.Accessory(
        setupOption("name"),
        hap.uuid.generate("hap.closedhab.addon"),
    );
    log(
        setupOption("name"),
        hap.uuid.generate("hap.closedhab.addon"));

    for (var s of Object.entries(setupOption("publish"))) {
        if (s[1].type === undefined) {
            error(`Homekit: Type of service "${s[0]}" is not defined`);
        }
        else {
            const servId = s[0];
            const service = new hap.Service(
                s[1].name || "Device",
                hap.uuid.generate(servId),
                s[1].type
            );
            for (var v of Object.entries(s[1].vars)) {
                if (v[1].id === undefined) {
                    error(`Homekit: Characteristic "${s[0]}.${v[0]}" has no id`);
                }
                else {
                    const vr = ctx.findVar(v[1].id);
                    if (vr === undefined) {
                        error(`Homekit: Var "${v[1].id}" not found`);
                    } else {
                        const chr = service.getCharacteristic(hap.Characteristic[v[0]]);
                        chr.on(hap.CharacteristicEventTypes.GET, callback => {
                            callback(undefined, vr.read());
                        });
                        chr.on(hap.CharacteristicEventTypes.SET, (value, callback) => {
                            warn(value);
                            vr.send(value);
                            callback();
                        });
                    }
                }
            }
            acs.addService(service);
        }
    }

    acs.on("advertised", _ => {
        log(`Homekit: Listening on port ${setupOption("port")}: ${setupOption("pin")}`);
    });
    log({
        username: setupOption("user"),
        pincode: setupOption("pin"),
        port: setupOption("port"),
        category: hap.Categories.BRIDGE,
    });
    acs.publish({
        username: setupOption("user"),
        pincode: setupOption("pin"),
        port: setupOption("port"),
        category: hap.Categories.BRIDGE,
    });
}

function stop() {
    return new Promise(resolve => {
        acs.destroy()
            .then(resolve);
    });
}

module.exports = {
    run,
    stop,
};
