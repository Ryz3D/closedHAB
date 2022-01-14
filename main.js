/*

TODO:
    - openhab addon lol
    - events as var attribute
        - triggers: onchange, onequal, rising, falling, oninit
        - events: send, exec
    - timer addon
    - still sub accumulation :/
    - what if sub 1 closes and sub 2 moves into its place?
        - random unique id
    - websocket api
    - rest:
        - retry on timeout (or reset item)
        - sse events
        - sse channels

*/

const fs = require('fs');
const { log, warn, error } = require('./out');
const yaml = require('js-yaml');
const watch = require('./recursive-watch');

// does not send data the first 10 seconds
const setupPath = "./setup/";
const setupFile = /^\w+.yaml/;
const addonsPath = "./addons/";
const setupParser = yaml.load;

var settleDelayOver = false;
var settleTimeout;
var setup = {
    addons: {},
    settleDelay: 10000,
};
var loadedModules = [];
var vars = [];
var varForwConvs = {};
var varBackConvs = {};

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

function loadModule(id, reloadCb = _ => { }) {
    const modPath = `${addonsPath}${id}.js`;
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
            vars[vars.length - 1].blocked = !settleDelayOver;
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
        if (a !== undefined && b !== undefined) {
            console.warn(`Setup files set value twice: "${a}" and "${b}"`);
        }
        return b === undefined ? a : b;
    }
}

function reloadSetup() {
    for (var entry of Object.entries(setup)) {
        if (entry[0] === "addons") {
            // load addons with vars first
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
    for (var subf of fs.readdirSync(dir, { withFileTypes: true })) {
        if (subf.isFile()) {
            if (subf.name.match(setupFile) !== null) {
                loadSetupFile(dir + subf.name);
            }
        }
        else if (subf.isDirectory()) {
            addSetupDir(dir + subf.name + "/");
        }
    }
}

function reloadAll(initial = false) {
    log(initial ? "Starting..." : "Restarting...");

    if (settleTimeout) {
        clearTimeout(settleTimeout);
    }
    for (var a of loadedModules) {
        if (a.mod.stop) {
            a.mod.stop();
        }
        delete require.cache[require.resolve(`${addonsPath}${a.id}`)];
    }
    loadedModules = [];
    for (var v of vars) {
        v.destroy();
    }

    if (setup.settleDelay > 0) {
        settleDelayOver = false;
        settleTimeout = setTimeout(_ => {
            for (var v of vars) {
                v.blocked = false;
            }
            settleDelayOver = true;
            log("Settle time over");
        }, setup.settleDelay || 10000);
    }
    else {
        settleDelayOver = true;
    }

    vars = [];
    varForwConvs = {};
    varBackConvs = {};
    setup = {};
    addSetupDir(setupPath);
    reloadSetup();
}

function initialize() {
    try {
        reloadAll(true);
        watch(setupPath, {
            persistent: false,
            recursive: true,
        }, reloadAll);
        watch(addonsPath, {
            persistent: false,
            recursive: true,
        }, reloadAll);
    }
    catch (e) {
        error(e);
    }
}

initialize();
