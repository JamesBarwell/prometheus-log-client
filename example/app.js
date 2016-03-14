'use strict'
const PromLog = require('../index')

const promLog = new PromLog()

// Expose Prometheus HTTP interface
promLog.listen(6754)

// Safely parse JSON
const getJson = raw => {
    let json
    try {
        return JSON.parse(raw)
    } catch (e) {
        // throw away unparsable lines
        return null
    }
}

// Match all log lines
promLog.createCounter(
    /^(WARN|ERROR)/,
    matches => {
        return {
            name: 'fail_log_lines',
            help: 'Count of total error and warn log lines',
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
        let json = getJson(matches[1])
        if (!json) {
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
        let json = getJson(matches[1])
        if (!json) {
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
