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
        this.matchers
        // Match line
        .map(matcher => {
            return {
                result: line.match(matcher.regex),
                callback: matcher.callback,
                type: matcher.type
            }
        })
        // Remove non-matches
        .filter(matcher => {
            return matcher.result !== null
        })
        // Get metric update
        .map(matcher => {
            return {
                update: matcher.callback(matcher.result),
                type: matcher.type
            }
        })
        // Update counters
        .forEach(matcher => {
            if (matcher.type === 'counter') {
                this.updateCounter(matcher.update)
            } else if (matcher.type === 'gauge') {
                this.updateGauge(matcher.update)
            }
        })
    }

    createCounter(regex, callback) {
        this.matchers.push({
            type: 'counter',
            regex: regex,
            callback: callback
        })
    }

    createGauge(regex, callback) {
        this.matchers.push({
            type: 'gauge',
            regex: regex,
            callback: callback
        })
    }

    updateCounter(data) {
        let name = data.name
        let help = data.help
        let labels = data.labels

        this.upsertMetric('counter', name, help)

        debug('increment counter %s with labels %s', name, labels)
        this.metrics[name].increment(labels)
    }

    updateGauge(data) {
        let name = data.name
        let help = data.help
        let labels = data.labels || {}

        this.upsertMetric('gauge', name, help)

        debug('increment guage %s with labels %s', name, labels)
        this.metrics[name].set(labels, data.value)
    }

    upsertMetric(type, name, help) {
        if (this.metrics[name]) {
            return
        }

        debug('creating metric %s %s', type, name)

        if (type === 'counter') {
            this.metrics[name] = this.client.createCounter({
                name: name,
                help: help
            })
        } else if (type === 'gauge') {
            this.metrics[name] = this.client.createGauge({
                name: name,
                help: help
            })
        }

    }

}
