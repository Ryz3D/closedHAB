const { ClosedVar, ClosedChannel, ClosedEvent } = require("../base");
const { log, warn, error } = require("../out");
const hap = require("hap-nodejs");

const defaultSetup = {
    "name": "closedHAB",
    "user": "CC:22:3D:E3:CE:31",
    "pin": "031-45-154",
    "port": 51826,
    "setupID": 1732,
    "publish": {},
    "setInterval": 3000,
};

var ctx;
var acs;
const intervals = [];

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

    acs = new hap.Bridge(
        setupOption("name"),
        hap.uuid.generate(`chb.bdg.${setupOption("user")}`),
    );

    acs.getService(hap.Service.AccessoryInformation)
        .setCharacteristic(hap.Characteristic.Manufacturer, "closedHAB")
        .setCharacteristic(hap.Characteristic.Model, "closedHAB Bridge")
        .setCharacteristic(hap.Characteristic.SerialNumber, setupOption("user"))
        .setCharacteristic(hap.Characteristic.FirmwareRevision, "1.0");

    for (var a of Object.entries(setupOption("publish"))) {
        const acsId = a[0];
        log(`Homekit: Adding Device "${a[1].name || acsId}"`);
        const bridgedAcs = new hap.Accessory(
            a[1].name || acsId,
            hap.uuid.generate(`chb.acs.${acsId}`),
        );

        const info = bridgedAcs.getService(hap.Service.AccessoryInformation);
        info.setCharacteristic(hap.Characteristic.Manufacturer, "closedHAB")
            .setCharacteristic(hap.Characteristic.Model, a[1].name || acsId)
            .setCharacteristic(hap.Characteristic.SerialNumber, setupOption("user"))
            .setCharacteristic(hap.Characteristic.FirmwareRevision, "1.0");

        if (a[1].identify) {
            log(`Homekit: Registering Identify ${a[1].identify.id} for ${a[1].name || acsId}`);
            const identVar = ctx.findVar(a[1].identify.id);
            if (identVar !== undefined) {
                const offValue = a[1].identify.offValue === undefined ? 0 : a[1].identify.offValue;
                const onValue = a[1].identify.onValue === undefined ? 1 : a[1].identify.onValue;
                const delayFactor = a[1].identify.delayFactor === undefined ? 1 : a[1].identify.delayFactor;

                info.getCharacteristic(hap.Characteristic.Identify).on(hap.CharacteristicEventTypes.SET, _ => {
                    const pre = identVar.read();
                    identVar.send(offValue);
                    setTimeout(_ => {
                        identVar.send(onValue);
                    }, 1000 * delayFactor);
                    setTimeout(_ => {
                        identVar.send(offValue);
                    }, 2000 * delayFactor);
                    setTimeout(_ => {
                        identVar.send(pre);
                    }, 3000 * delayFactor);
                });
            }
        }

        for (var s of Object.entries(a[1].services || {})) {
            const service = new hap.Service[s[0]](
                a[1].name || acsId,
            );

            for (var v of Object.entries(s[1])) {
                if (v[1].id === undefined) {
                    error(`Homekit: Characteristic "${acsId}.${s[0]}.${v[0]}" has no id`);
                }
                else {
                    const vr = ctx.findVar(v[1].id);
                    if (vr !== undefined) {
                        const chr = service.getCharacteristic(hap.Characteristic[v[0]]);
                        const forwConvs = v[1].forwardConverters || [];
                        const backConvs = v[1].backwardConverters || [];
                        vr.sub(val => {
                            for (var c of backConvs) {
                                const convCtx = { ...ctx, setup: c.setup || {} };
                                val = require(`./${c.id}.js`).convert(val, convCtx);
                            }
                            chr.setValue(val);
                        });
                        intervals.push(setInterval(_ => {
                            if (vr.initialized) {
                                var val = vr.read();
                                if (val !== undefined) {
                                    for (var c of backConvs) {
                                        const convCtx = { ...ctx, setup: c.setup || {} };
                                        val = require(`./${c.id}.js`).convert(val, convCtx);
                                    }
                                    chr.setValue(val);
                                }
                            }
                        }, setupOption("setInterval", v[1].setup)));
                        chr.on(hap.CharacteristicEventTypes.GET, callback => {
                            if (vr.initialized) {
                                var val = vr.read();
                                if (val === undefined) {
                                    callback(undefined, chr.value);
                                }
                                else {
                                    for (var c of backConvs) {
                                        const convCtx = { ...ctx, setup: c.setup || {} };
                                        val = require(`./${c.id}.js`).convert(val, convCtx);
                                    }
                                    callback(undefined, val);
                                }
                            }
                            else {
                                callback(undefined, chr.value);
                            }
                        });
                        chr.on(hap.CharacteristicEventTypes.SET, (value, callback) => {
                            var val = value;
                            for (var c of forwConvs) {
                                const convCtx = { ...ctx, setup: c.setup || {} };
                                val = require(`./${c.id}.js`).convert(val, convCtx);
                            }
                            vr.send(val);
                            callback(undefined);
                        });
                    }
                }
            }
            bridgedAcs.addService(service);
        }

        acs.addBridgedAccessory(bridgedAcs);
    }

    acs.on("unpaired", _ => {
        log(`Homekit: Unpaired`);
    })
    acs.on("paired", _ => {
        log(`Homekit: Paired`);
    })
    acs.on("advertised", _ => {
        log(`Homekit: Listening on port ${setupOption("port")} with pin ${setupOption("pin")}`);
    });

    try {
        acs.publish({
            username: setupOption("user"),
            pincode: setupOption("pin"),
            port: setupOption("port"),
            category: hap.Categories.BRIDGE,
            setupID: setupOption("id"),
            addIdentifyingMaterial: true,
        });
    }
    catch (e) {
        error(`Homekit: Can't start: ${e}`);
    }
}

function stop() {
    return new Promise(resolve => {
        if (acs) {
            acs.removeAllBridgedAccessories();
            acs.removeAllListeners();
            acs.unpublish()
                .then(_ => acs.destroy())
                .then(_ => resolve());
        }
        else {
            resolve();
        }
    });
}

module.exports = {
    run,
    stop,
};
