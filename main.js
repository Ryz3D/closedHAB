/*
Addon Interface 1.0
    - setup {}
    - registerVar(var)
    - unregisterVar(id)
    - findVar(id)
    - listVars()
    - back(id, data)
    - forw(id, data)

ClosedVar 1.0       VARIABLE        CHANNEL             EVENT
    - type()        1               2                   3
    - send(val)     sets to value   writes to channel   fires event
    - read()        returns value   -                   -
    - sub(cb)       on change       on available        on fired
*/

/*
TODO:
    - reload converters properly
*/

const fs = require("fs");
const { log, warn, error } = require("./out");

const baseSetupPath = "./setup/";
const setupFilePath = "setup.json";
const addonsPath = "addons/";

var setup = {};
var loadedModules = [];
const vars = [];
const varForwConvs = {};
const varBackConvs = {};

function registerVar(vr) {
    if (vars.findIndex(v => v.id === vr.id) === -1) {
        log(`Registering var "${vr.id}"`);
        return vars[vars.push(vr) - 1];
    }
    else {
        error(`Can't register var (ID in use): "${vr.id}"`);
    }
}

function unregisterVar(id) {
    const index = vars.findIndex(v => v.id === id);
    if (index !== -1) {
        log(`Unregistering var "${id}"`);
        vars.splice(index, 1);
    }
    else {
        log(`Tried unregistering non-existent var "${id}"`)
    }
}

function findVar(id) {
    const index = vars.findIndex(v => v.id === id);
    if (index === -1) {
        warn(`Could not find var "${id}"`);
    }
    else {
        return vars[index];
    }
}

function unloadModule(id) {
    return new Promise(resolve => {
        const index = loadedModules.findIndex(m => m.id === id);
        if (index === -1) {
            log(`Tried unloading module "${id}" which is not loaded`);
            resolve();
        }
        else {
            if (loadedModules[index].mod.stop) {
                loadedModules[index].mod.stop()
                    .then(resolve);
            }
            else {
                resolve();
            }
        }
    });
}

function loadModule(id, reloadCb = _ => { }) {
    const modPath = `${baseSetupPath}${addonsPath}${id}.js`;
    if (loadedModules.findIndex(m => m.id === id) === -1) {
        fs.watchFile(modPath, { persistent: false }, _ => {
            log(`Reloading addon "${id}"`);
            try {
                unloadModule(id)
                    .then(_ => {
                        delete require.cache[require.resolve(modPath)];
                        reloadCb(loadModule(id));
                    });
            }
            catch (e) {
                error(`Can't reload module "${id}": ${e}`);
            }
        });
    }
    try {
        const mod = require(modPath);
        return loadedModules[loadedModules.push({ id, mod }) - 1].mod;
    }
    catch (e) {
        error(`Can't load module "${id}": ${e}`);
    }
}

function getConv(id) {
    const index = loadedModules.findIndex(m => m.id === id);
    if (index === -1) {
        return loadModule(id);
    }
    else {
        return loadedModules[index].mod;
    }
}

function loadAddon(id, addon_setup, addon_register, mod) {
    if (!mod) {
        mod = loadModule(id, m => loadAddon(id, addon_setup, addon_register, m));
    }
    mod.run({
        setup: addon_setup || {},
        registerVar,
        unregisterVar,
        findVar,
        listVars: _ => vars,
        back: (id, v) => varBackConvs[id](v),
        forw: (id, v) => varForwConvs[id](v),
    });
    for (var r of addon_register || []) {
        const forwBuf = [...(r.forwardConverters || [])];
        varForwConvs[r.id] = v => {
            for (var c of forwBuf) {
                const mod = getConv(c.id);
                v = mod.convert(v, c.setup);
            }
            return v;
        };
        const backBuf = [...(r.backwardConverters || [])];
        varBackConvs[r.id] = v => {
            for (var c of backBuf) {
                const mod = getConv(c.id);
                v = mod.convert(v, c.setup);
            }
            return v;
        };
        if (mod.register) {
            mod.register(r.id, r.setup);
        }
        else {
            error(`Addon "${id}" doesn't support register`);
        }
    }
}

function loadSetupFile() {
    var previous = JSON.stringify(setup);
    try {
        setup = JSON.parse(fs.readFileSync(`${baseSetupPath}${setupFilePath}`));
        if (JSON.stringify(setup) != previous) {
            log("Loading setup file");
            for (var entry of Object.entries(setup)) {
                if (entry[0] === "addons") {
                    for (var iAddon in loadedModules) {
                        const oldAddon = loadedModules[iAddon];
                        log(oldAddon)
                        if (entry[1].findIndex(a.id === oldAddon.id) === -1) {
                            fs.unwatchFile(`${baseSetupPath}${addonsPath}${oldAddon.id}.js`);
                            unloadModule(oldAddon.id);
                            delete loadedModules[iAddon];
                        }
                    }
                    for (var a of entry[1]) {
                        if (a.id) {
                            loadAddon(a.id, a.setup, a.register);
                        }
                        else {
                            error("Missing \"id\" tag in addon");
                        }
                    }
                }
                else {
                    warn(`Unknown setup option "${entry[0]}"`);
                }
            }
            // do more reloading here if neccessary
        }
    }
    catch (e) {
        error(e);
    }
}

function initSetup() {
    fs.watchFile(`${baseSetupPath}${setupFilePath}`, { persistent: false }, _ => loadSetupFile());
    loadSetupFile();
}

function initialize() {
    initSetup();
}

initialize();
