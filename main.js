http = require('http');
jira = require('jira')

var requestListener = function (req, res) {
  res.writeHead(200);
  res.end('Hello, World!\n');
}

var server = http.createServer(requestListener).listen(80);