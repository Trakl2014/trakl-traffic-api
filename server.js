var http = require('http');
var https = require('https');
var xml2js = require('xml2js');

var port = process.env.port || 1337;

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // request API data from NZTA
    //https://infoconnect1.highwayinfo.govt.nz/ic/jbi/SsdfJourney2/REST/FeedService/journey/R04-NB

    var nztaOptions = {
        host: 'infoconnect1.highwayinfo.govt.nz',
        port: 443,
        path: '/ic/jbi/SsdfJourney2/REST/FeedService/journey/R04-NB',
        headers: {
            "username": "DanielLa",
            "password": "Password1"
        }
    };

    https.get(nztaOptions, function (nztaResponse) {
        var nztaData = '';

        nztaResponse.on('data', function (chunk) {
            // chunk response from NZTA
            nztaData += chunk;
            var message = "" + chunk; 
            console.log('Received response of ' + message.length + ' bytes from nzta.');
        });

        nztaResponse.on('end', function () {
            // final response, now process data
            console.log('response end.');

            xml2js.parseString(nztaData, function (err, result) {
                var journey = {
                    name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],
                    averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0]
                }

                // end response
                res.statusCode = 200;
                res.end(JSON.stringify(journey));
            });

        });

    });

}).listen(port);