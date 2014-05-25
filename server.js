var http = require('http');
var port = process.env.port || 1337;
var url = require('url');

console.log('Server started on port: ' + port);

http.createServer(function (req, res) {

    res.writeHead(200, { 'Content-Type': 'application/json' });
    console.log('Request URL = ' + req.url);
    var pathname = url.parse(req.url).pathname;

    switch (pathname) {
        case "/journey":
            var journey = require('./journey.js');
            journey.getJourneyData(req.url, function(data) {
                res.statusCode = 200;
                res.end(JSON.stringify(data));
            });
            break;
        case "/journeys":
            var journeyList = require('./journeyList.js');
            journeyList.getNames('./Auckland-Journeys.xml', function(data) {
                res.statusCode = 200;
                res.end(JSON.stringify(data));
            });
            break;
        default:
            res.statusCode = 200;
            res.end("{'message':'Expecting /journey/REF or /journeys'}");
    }

}).listen(port);