'use strict'
const Tail = require('always-tail')
const debug = require('debug')('prometheus-logs')
const Prometheus = require('prometheus-client-js')


module.exports = class PromLog {
    constructor() {
        this.client = new Prometheus()
        this.matchers = []
        this.metrics = {}
    }

    listen(port) {
        debug('http server listening on %s', port)
        this.client.createServer(port)
    }

    watch(path) {
        debug('tailing logs at: %s', path)
        let tail = new Tail(path, '\n')
        tail.on('line', this.parseLogLine.bind(this))
        tail.on('error', (err) => {
            console.error('Error', err)
        })
        tail.watch()
    }

    parseLogLine(line) {
        this.matchers.map(matcher => {
            return {
                result: line.match(matcher.regex),
                callback: matcher.callback
            }
        }).filter(matcher => {
            return matcher.result !== null
        }).forEach(matcher => {
            this.updateMetrics(matcher.callback(matcher.result))
        })
    }

    createCounter(regex, callback) {
        this.matchers.push({
            regex: regex,
            callback: callback
        })
    }

    updateMetrics(result) {
        let name = result.name
        let help = result.help
        let labels = result.labels

        if (!this.metrics[name]) {
            debug('creating metric %s', name)
            this.metrics[name] = this.client.createCounter({
                name: name,
                help: help
            })
        }

        debug('increment counter %s with labels %s', name, labels)
        this.metrics[name].increment(labels)
    }

}
