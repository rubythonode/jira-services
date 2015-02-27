http = require('http');
jira = require('jira')

var requestListener = function (req, res) {
  res.writeHead(200);
  res.end('Hello, World!\n');
}
var port = process.env.PORT || 8080;
console.log(port);
var server = http.createServer(requestListener).listen(port);