function log(...param) {
    console.log(`[${new Date().toLocaleTimeString()}]`, ...param);
}

function warn(...param) {
    console.warn(`[${new Date().toLocaleTimeString()}] WARNING:`, ...param);
}

function error(...param) {
    console.error(`[${new Date().toLocaleTimeString()}] ERROR:`, ...param);
}

module.exports = {
    log,
    warn,
    error
};
