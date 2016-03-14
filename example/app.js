'use strict'
const PromLog = require('../index')

const promLog = new PromLog()

// Expose Prometheus HTTP interface
promLog.listen(6754)

// Match all log lines
promLog.createCounter(
    /^(DEBUG|INFO|NOTICE|WARN|ERROR)/,
    matches => {
        return {
            name: 'log_lines',
            help: 'Count of total app log lines',
            labels: {
                level: matches[1].toLowerCase()
            }
        }
    }
)

// Match request.end and gather HTTP response status codes
promLog.createCounter(
    /[A-Z]+ http.request.end (.*)/,
    matches => {
        let json
        try {
            json = JSON.parse(matches[1])
        } catch (e) {
            // throw away unparsable lines
            return
        }

        return {
            name: 'response_codes',
            help: 'Count of responses by HTTP status',
            labels: {
                code: json.status
            }
        }
    }
)

// Update active users gauge
promLog.createGauge(
    /[A-Z]+ stats.active_users ([0-9]+)/,
    matches => {
        return {
            name: 'active_users',
            help: 'Current active users in application',
            value: matches[1]
        }
    }
)

// Match request.end and create histogram of response times
promLog.createHistogram(
    /[A-Z]+ http.request.end (.*)/,
    matches => {
        let json
        try {
            json = JSON.parse(matches[1])
        } catch (e) {
            // throw away unparsable lines
            return
        }

        return {
            name: 'response_times',
            help: 'Bucketed response times',
            buckets: [ 10, 20, 30, 40, 50, 75, 100, 200 ],
            value: json.time
        }
    }
)

// Tail app logs
promLog.watch('./test.log')
