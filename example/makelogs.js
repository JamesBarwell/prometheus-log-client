const fs = require('fs')

setInterval(() => {
    fs.appendFile('./test.log', getLogLine() + '\n', (err) => {
        if (err) throw err;
    })
}, 500)

console.log('writing to ./test.log')

const getLogLine = () => {
    const lines = [
        'INFO http.request.start { "url": "/" }',
        'INFO http.request.end { "time": 34, "status": 200 }',
        'INFO http.request.start { "url": "/about" }',
        'INFO http.request.end { "time": 16, "status": 200 }',
        'INFO http.request.start { "url": "/products" }',
        'INFO http.request.end { "time": 51, "status": 200 }',
        'INFO http.request.start { "url": "/form/send " }',
        'INFO http.request.end { "time": 43, "status": 302 }',
        'INFO api.request.start { "endpoint": "app01" }',
        'INFO api.request.end { "endpoint": "app01", "time": 8 }',
        'INFO api.request.start { "endpoint": "app02" }',
        'INFO api.request.end { "endpoint": "app02", "time": 14 }',
        'INFO api.request.start { "endpoint": "app03" }',
        'INFO api.request.end { "endpoint": "app03", "time": 23 }',
        'NOTICE user.login { "success": true }',
        'NOTICE user.transaction { "value": 500 }',
        'WARN user.login { "success": false, "reason": "csrf mismatch" }',
        'ERROR session.read { "host": "ses01", "errorCode": 1 }',
        'INFO stats.active_users 143',
        'INFO stats.active_users 124',
        'INFO stats.active_users 160',
        'INFO stats.active_users 127',
    ]

    const lineIndex = Math.floor(Math.random() * lines.length)

    return lines[lineIndex]
}
