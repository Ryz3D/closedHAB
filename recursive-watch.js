// slightly modified version of https://github.com/mafintosh/recursive-watch/

var os = require('os')
var fs = require('fs')
var path = require('path')
var Cache = require('ttl')

var isLinux = os.platform() === 'linux' // native recursive watching not supported here
var watchDirectory = isLinux ? watchFallback : watchRecursive

module.exports = watch

function watch(name, settings, onchange) {
    var clear = null
    var stopped = false

    fs.lstat(name, function (_, st) {
        if (!st || stopped) {
            stopped = true
            return
        }
        clear = st.isDirectory() ? watchDirectory(name, settings, onchange) : watchFile(name, settings, onchange)
    })

    return function () {
        if (stopped) return
        stopped = true
        if (clear) {
            clear()
        }
    }
}

function watchFile(filename, settings, onchange) {
    var prev = null
    var prevTime = 0

    var w = fs.watch(filename, settings || {}, function () {
        fs.lstat(filename, function (_, st) {
            var now = Date.now()
            if (now - prevTime > 2000 || !same(st, prev)) onchange(filename)
            prevTime = now
            prev = st
        })
    })

    return function () {
        w.close()
    }
}

function watchRecursive(directory, settings, onchange) {
    // filename might not be passed which does not matter in this project
    var w = fs.watch(directory, { recursive: true, ...(settings || {}) }, onchange);

    return function () {
        w.close()
    }
}

function watchFallback(directory, settings, onchange) {
    var watching = {}
    var loaded = false
    var queued = []
    var prevs = new Cache({ ttl: 2e3, capacity: 30 })

    visit('.', settings, function () {
        loaded = true
    })

    return function () {
        Object.keys(watching).forEach(function (dir) {
            watching[dir].close()
        })
    }

    function emit(name) {
        queued.push(name)
        if (queued.length === 1) update()
    }

    function update() {
        var filename = queued[0]

        fs.lstat(filename, function (err, st) {
            var w = watching[filename]

            if (err && w) {
                w.close()
                delete watching[filename]
            }

            var prevSt = prevs.get(filename)
            if (!prevSt || !same(st, prevSt)) onchange(filename)
            prevs.put(filename, st)

            visit(path.relative(directory, filename), settings, function () {
                queued.shift()
                if (queued.length) update()
            })
        })
    }

    function visit(next, settings, cb) {
        var dir = path.join(directory, next)

        fs.lstat(dir, function (err, st) {
            if (err || !st.isDirectory()) return cb()
            if (watching[dir]) return cb()
            if (loaded) emit(dir)

            var w = fs.watch(dir, settings || {}, function (change, filename) {
                filename = path.join(next, filename)
                emit(path.join(directory, filename))
            })

            w.on('error', noop)
            watching[dir] = w

            fs.readdir(dir, function (err, list) {
                if (err) return cb(err)

                loop()

                function loop() {
                    if (!list.length) return cb()
                    visit(path.join(next, list.shift()), settings, loop)
                }
            })
        })
    }
}

function noop() { }

function same(a, b) {
    if (!a || !b) return false
    return a.dev === b.dev &&
        a.mode === b.mode &&
        a.nlink === b.nlink &&
        a.uid === b.uid &&
        a.gid === b.gid &&
        a.rdev === b.rdev &&
        a.blksize === b.blksize &&
        a.ino === b.ino &&
        // a.size === b.size && DONT TEST - is a lying value
        // a.blocks === b.blocks && DONT TEST - is a lying value
        a.atime.getTime() === b.atime.getTime() &&
        a.mtime.getTime() === b.mtime.getTime() &&
        a.ctime.getTime() === b.ctime.getTime()
}
