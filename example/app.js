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

// Tail app logs
promLog.watch('./test.log')
