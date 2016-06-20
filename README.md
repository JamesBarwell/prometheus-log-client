prometheus-log-client
------

This module provides a simple way to turn your application logs into Prometheus metrics, using regex to match and extract data from the logs.

It is intended for use with applications that already provide logging, and where retrofitting Prometheus instrumentation may be difficult, e.g. an existing PHP application.

## How to use

Install from npm:
```js
npm install prometheus-log-client
```

```js
const PromLog = require('prometheus-log-client')
const promLog = new PromLog(6754)

promLog.listen()

promLog.createCounter(
    /^(WARN|ERROR)/, // regex to match again
    matches => { // how to process the matches
        return {
            name: 'fail_log_lines',
            help: 'Count of total error and warn log lines',
            labels: {
                level: matches[1].toLowerCase()
            }
        }
    }
)

promLog.watch('./test.log', '\n', (err) => {
    console.warn(err)
})
```

See `example/app.js` for a full working example.

## Sample output

```
# HELP active_users Current active users in application
# TYPE active_users gauge
active_users 160
# HELP response_codes Count of responses by HTTP status
# TYPE response_codes counter
response_codes{code="200"} 37
response_codes{code="302"} 13
# HELP response_times Bucketed response times
# TYPE response_times histogram
response_times_bucket{le="10"} 0
response_times_bucket{le="20"} 6
response_times_bucket{le="30"} 0
response_times_bucket{le="40"} 14
response_times_bucket{le="50"} 13
response_times_bucket{le="75"} 17
response_times_bucket{le="100"} 0
response_times_bucket{le="200"} 0
response_times_bucket{le="+Inf"} 0
response_times_count 50
response_times_sum 1998
# HELP fail_log_lines Count of total error and warn log lines
# TYPE fail_log_lines counter
fail_log_lines{level="warn"} 14
fail_log_lines{level="error"} 16
```
