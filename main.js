/*

Addon Interface 1.0
    - setup {}
    - registerVar(var)
    - unregisterVar(id)
    - findVar(id)
    - listVars()
    - back(id, data)
    - forw(id, data)

*/

/*

TODO:
    - timer addon
        - cron -> cli interface? files? local socket?
        - trigger closedevent
    - still sub accumulation :/
    - what if sub 1 closes and sub 2 moves into its place?
        - random unique id
    - reload converters properly
    - websocket api
    - close:
        - sse auth
    - rest:
        - retry on timeout (or reset item)
        - why do i have so many timeouts?
            - delay some requests, especially to same server (zway too!)
        - sse events
        - sse channels

*/

const fs = require("fs");
const { log, warn, error } = require("./out");
const yaml = require('js-yaml');

const baseSetupPath = "./setup/";
const setupFile = /^\w+.yml/;
const addonsPath = "addons/";
const setupParser = yaml.load;

var setup = { addons: {} };
var loadedModules = [];
const vars = [];
const varForwConvs = {};
const varBackConvs = {};

function registerVar(vr) {
    log(`Registering var "${vr.id}"`);
    const index = vars.findIndex(v => v.id === vr.id);
    if (index === -1) {
        return vars[vars.push(vr) - 1];
    }
    else {
        vars[index].destroy();
        vars[index] = vr;
        return vars[index];
    }
}

function unregisterVar(id) {
    const index = vars.findIndex(v => v.id === id);
    if (index === -1) {
        log(`Tried unregistering non-existent var "${id}"`);
    }
    else {
        log(`Unregistering var "${id}"`);
        vars[index].destroy();
        vars.splice(index, 1);
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

function loadAddon(id, addon_setup = {}, addon_register = [], mod) {
    if (!mod) {
        mod = loadModule(id, m => loadAddon(id, addon_setup, addon_register, m));
    }
    mod.run({
        setup: addon_setup,
        registerVar,
        unregisterVar,
        findVar,
        listVars: _ => vars,
        back: (id, v) => varBackConvs[id](v),
        forw: (id, v) => varForwConvs[id](v),
    });
    for (var r of Object.entries(addon_register)) {
        const forwBuf = [...(r[1].forwardConverters || [])];
        varForwConvs[r[0]] = v => {
            for (var c of forwBuf) {
                const mod = getConv(c.id);
                v = mod.convert(v, {
                    setup: c.setup || {},
                    registerVar,
                    unregisterVar,
                    findVar,
                    listVars: _ => vars,
                    back: (id, v) => varBackConvs[id](v),
                    forw: (id, v) => varForwConvs[id](v),
                });
            }
            return v;
        };
        const backBuf = [...(r[1].backwardConverters || [])];
        varBackConvs[r[0]] = v => {
            for (var c of backBuf) {
                const mod = getConv(c.id);
                v = mod.convert(v, {
                    setup: c.setup || {},
                    registerVar,
                    unregisterVar,
                    findVar,
                    listVars: _ => vars,
                    back: (id, v) => varBackConvs[id](v),
                    forw: (id, v) => varForwConvs[id](v),
                });
            }
            return v;
        };
        if (mod.register) {
            mod.register(r[0], r[1].setup || {});
        }
        else {
            error(`Addon "${id}" doesn't support register`);
        }
    }
}

function extendRecursive(a, b) {
    if (typeof a === "object") {
        if (a === undefined) {
            return b;
        }
        if (b === undefined) {
            return a;
        }
        if ((a.constructor || {}).name === "array") {
            return [
                ...a,
                ...b,
            ];
        }
        else {
            const newObj = {};
            for (var k of [...Object.keys(a), ...Object.keys(b)]) {
                newObj[k] = extendRecursive(a[k], b[k]);
            }
            return newObj;
        }
    }
    else {
        return b === undefined ? a : b;
    }
}

function reloadSetup() {
    for (var entry of Object.entries(setup)) {
        if (entry[0] === "addons") {
            for (var iAddon in loadedModules) {
                const oldAddon = loadedModules[iAddon];
                if (!entry[1][oldAddon.id]) {
                    fs.unwatchFile(`${baseSetupPath}${addonsPath}${oldAddon.id}.js`);
                    unloadModule(oldAddon.id);
                    delete loadedModules[iAddon];
                }
            }
            // load addons which can register vars first
            for (var a of Object.entries(entry[1]).filter(a => a[1].register !== undefined)) {
                loadAddon(a[0], a[1].setup, a[1].register);
            }
            for (var a of Object.entries(entry[1]).filter(a => a[1].register === undefined)) {
                loadAddon(a[0], a[1].setup);
            }
        }
        else {
            warn(`Unknown setup option "${entry[0]}"`);
        }
    }
}

function loadSetupFile(path) {
    try {
        log(`Loading setup file "${path}"`);
        const newData = setupParser(fs.readFileSync(path, { encoding: "utf-8" }));
        setup = extendRecursive(setup, newData);
    }
    catch (e) {
        error(e);
    }
}

function addSetupDir(dir) {
    for (var subf of fs.readdirSync(baseSetupPath + dir, { withFileTypes: true })) {
        if (subf.isFile()) {
            if (subf.name.match(setupFile) !== null) {
                const path = baseSetupPath + dir + subf.name;
                fs.watchFile(path, { persistent: false }, _ => {
                    loadSetupFile(path);
                    reloadSetup();
                });
                loadSetupFile(path);
            }
        }
        else if (subf.isDirectory()) {
            addSetupDir(dir + subf.name + "/");
        }
    }
}

function initialize() {
    try {
        addSetupDir("addon_setup/");
        log("Starting...");
        reloadSetup();
    }
    catch (e) {
        error(e);
    }
}

initialize();
