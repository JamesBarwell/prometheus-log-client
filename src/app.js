'use strict'
const Tail = require('always-tail')
const debug = require('debug')('prometheus-logs')
const Prometheus = require('prometheus-client-js')

const parseLogLines = (matchers, line) => {
    for (let i in matchers) {
        let matcher = matchers[i]
        debug ('attempting regex: %s', matcher.regex)
        let matches = line.match(matcher.regex)
        if (matches === null) {
            continue
        }

        let result = matcher.parse(matches)
    }
}

module.exports = class PromLog {
    constructor() {
        this.client = new Prometheus()
        this.matchers = []
    }

    listen(port) {
        debug('http server listening on %s', port)
        this.client.createServer(port)
    }

    match(regex, parseFunc) {
        this.matchers.push({
            regex: regex,
            parse: parseFunc
        })
        debug('created matcher for regex: %s', regex)
    }

    watch(path) {
        debug('tailing logs at: %s', path)
        let tail = new Tail(path, '\n')
        tail.on('line', parseLogLines.bind(null, this.matchers))
        tail.on('error', (err) => {
            console.error('Error', err)
        })
        tail.watch()
    }

}
