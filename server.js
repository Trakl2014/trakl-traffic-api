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
            journey.getJourneyData(req.url, function(error, data) {
                if (error) {
                    res.statusCode = 500;
                    res.end('{"ok":"false", "message":"' + error + '"}');
                }

                // end response
                res.statusCode = 200;
                res.end(JSON.stringify(data));
            });
            break;
        case "/journeys":
            var journeyList = require('./journeyList.js');
            journeyList.getNames('./Auckland-Journeys.xml', function(data) {
                res.statusCode = 200;
                res.end(data);
            });
            break;
        case "/pollJourney":
            var pollInfoConnect = require('./poll-infoconnect.js');
            pollInfoConnect.pollJourney(req.url, function (error, data) {
                if (error) {
                    res.statusCode = 500;
                    res.end('{"ok":"false", "message":"' + error + '"}');
                }

                // end response
                res.statusCode = 200;
                res.end(JSON.stringify(data));
            });
            break;
        default:
            res.statusCode = 200;
            res.end('{"message":"Expecting /journey/REF or /journeys"}');
    }

}).listen(port);
