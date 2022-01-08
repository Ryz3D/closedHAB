const { Stream } = require("stream");
const { log, warn, error } = require("./out");

class ClosedBase {
    constructor(id) {
        if (id) {
            this.id = id;
        }
        else {
            error("ClosedBase: Can't call constructor without id");
        }
        this.initialized = false;
    }

    type() {
        return -1;
    }

    send(val) {
        error("ClosedBase: no send function defined");
    }

    read() {
        error("ClosedBase: no read function defined");
    }

    sub(cb) {
        error("ClosedBase: no sub function defined");
    }
}

class ClosedVar extends ClosedBase {
    constructor(id) {
        super(id);
        this.subs = [];
        this.value = 0;
    }

    type() {
        return 1;
    }

    send(val) {
        if (this.initialized) {
            if (this.value !== val && val !== null && val !== undefined && !isNaN(val)) {
                log(`ClosedVar: "${this.id}" ${this.value} -> ${val}`);
                this.value = val;
                for (var s of this.subs) {
                    s(this.value);
                }
            }
        }
        else {
            if (val !== null && val !== undefined) {
                log(`ClosedVar: "${this.id}" init -> ${val}`);
                this.value = val;
                this.initialized = true;
                for (var s of this.subs) {
                    s(this.value);
                }
            }
        }
    }

    read() {
        if (this.initialized) {
            return this.value;
        }
        else {
            warn(`ClosedVar: Can't read "${this.id}", not initialized`);
        }
    }

    sub(cb) {
        if (this.subs.length > 50) {
            warn(`ClosedVar: Over 50 subs on "${this.id}"`);
        }
        const index = this.subs.push(cb) - 1;
        return _ => this.subs.splice(index, 1);
    }
}

class ClosedChannel extends ClosedBase {
    constructor(id) {
        super(id);
        this.stream = new Stream.Readable();
        this.stream._read = _ => { };
        this.initialized = true;
    }

    type() {
        return 2;
    }

    send(val) {
        this.stream.push(val);
    }

    read() {
        warn("ClosedChannel: Do not use read function on Channels, read continously using sub");
    }

    sub(cb) {
        if (this.stream.listenerCount() > 50) {
            warn(`ClosedChannel: Over 50 listeners on "${this.id}"`);
        }
        cb(outStream => this.stream.pipe(outStream));
    }
}

class ClosedEvent extends ClosedBase {
    constructor(id) {
        super(id);
        this.subs = [];
        this.initialized = true;
    }

    type() {
        return 3;
    }

    send(val) {
        log(`ClosedEvent: Triggered "${this.id}"`);
        for (var s of this.subs) {
            s();
        }
    }

    read() {
        warn("ClosedEvent: Do not use read function on Events, add callbacks with sub");
    }

    sub(cb) {
        if (this.subs.length > 50) {
            warn(`ClosedVar: Over 50 subs on "${this.id}"`);
        }
        return _ => this.subs.splice(this.subs.push(cb), 1);
    }
}

module.exports = {
    ClosedBase,
    ClosedVar,
    ClosedChannel,
    ClosedEvent,
};
