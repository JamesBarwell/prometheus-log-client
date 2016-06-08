'use strict'
const Tail = require('always-tail')
const debug = require('debug')('prometheus-logs')
const Prometheus = require('prometheus-client-js')

module.exports = class PromLog {

    constructor(tailInterval) {
        this.client = new Prometheus()
        this.matchers = []
        this.metrics = {}
        this.tailInterval = tailInterval || 500;
    }

    listen(port) {
        debug('http server listening on %s', port)
        this.server = this.client.createServer(port)
    }

    watch(path, split, onError) {
        debug('tailing logs at: %s', path)
        this.tail = new Tail(
            path,
            split || '\n',
            { interval: this.tailInterval }
        )
        this.tail.on('line', this.parseLogLine.bind(this))
        this.tail.on('error', onError || function() {})
        this.tail.watch()
    }

    stop() {
        if (this.tail) {
            this.tail.unwatch();
        }

        if (this.server) {
            this.server.close();
        }
    }

    parseLogLine(line) {
        this.matchers
        // Match line
        .map(matcher => {
            matcher.result = line.match(matcher.regex)
            return matcher
        })
        // Remove non-matches
        .filter(matcher => {
            return matcher.result !== null
        })
        // Get metric update
        .map(matcher => {
            let update;
            try {
                update = matcher.callback(matcher.result);
            } catch (e) {
                return null;
            }

            return {
                update: update,
                type: matcher.type
            }
        })
        // Remove any bad matches
        .filter(matcher => {
            return matcher !== null;
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
        if (!data) {
            return;
        }

        let labels = data.labels || {}
        let value = data.value || null

        debug('update metric %s %s', type, data.name)
        this.upsertMetric(type, data)

        if (type === 'counter') {
            this.metrics[data.name].increment(labels, value || 1)
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
