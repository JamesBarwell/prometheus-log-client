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

    watch(path, split) {
        debug('tailing logs at: %s', path)
        let tail = new Tail(path, split || '\n')
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
            this.updateMetric(matcher.type, matcher.update)
        })
    }

    createMetric(type, regex, callback) {
        this.matchers.push({
            type: type,
            regex: regex,
            callback: callback
        })
    }

    createCounter(regex, callback) {
        this.createMetric('counter', regex, callback)
    }

    createGauge(regex, callback) {
        this.createMetric('gauge', regex, callback)
    }

    createHistogram(regex, callback) {
        this.createMetric('histogram', regex, callback)
    }

    updateMetric(type, data) {
        let labels = data.labels || {}
        let value = data.value || null

        debug('increment metric %s %s', type, data.name)
        this.upsertMetric(type, data)

        if (type === 'counter') {
            this.metrics[data.name].increment(labels)
        } else if (type === 'gauge') {
            this.metrics[data.name].set(labels, value)
        } else if (type === 'histogram') {
            this.metrics[data.name].observe(value)
        }
    }

    upsertMetric(type, data) {
        if (this.metrics[data.name]) {
            return
        }

        debug('create metric %s %s', type, data.name)

        let createFunction = 'create' +
            type.charAt(0).toUpperCase() + type.substring(1)

        this.metrics[data.name] = this.client[createFunction](data)
    }

}
