var http = require('http');
var url = require('url');

var port = process.env.port || 1337;

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    console.log('Request URL = ' + req.url);

    var pathname = url.parse(req.url).pathname;

    switch (pathname) {
        case "/journey":
            var journey = require('./journey.js');
            journey.getJourneyData(req.url, function(data) {
                // end response
                res.statusCode = 200;
                res.end(JSON.stringify(data));
            });
            break;
        case "/journeys":
            // Peter: Call your function here....
            res.statusCode = 200;
            res.end("{'message':'/journeys coming soon'}");
        default:
            res.statusCode = 200;
            res.end("{'message':'Expecting /journey/REF or /journeys'}");
    }

}).listen(port);