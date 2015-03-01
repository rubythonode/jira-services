http = require('http');
jep = require('./jira-event-processor');

var requestListener = function (req, res) {
        var jiraEvent = "",
            jiraIssue,
            jiraIssueUpdate;

        req.on('data', function (chunk) {
            jiraEvent += chunk;
        });
        req.on('end', function () {
            console.log("event: " + jiraEvent);
            jep.process(JSON.parse(jiraEvent));
        });

        res.writeHead(200);
        res.end('Got it!\n');

    },
    port = process.env.PORT || 8080,
    server = http.createServer(requestListener);

console.log(port);
server.listen(port);