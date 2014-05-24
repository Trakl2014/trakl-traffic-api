exports.getJourneyData = function (reqUrl, callback) {
    var https = require('https');
    var xml2js = require('xml2js');
    var url = require('url');

    // request API data from NZTA
    //https://infoconnect1.highwayinfo.govt.nz/ic/jbi/SsdfJourney2/REST/FeedService/journey/R04-NB

    var query = url.parse(reqUrl, true).query;

    if (!query["ref"]) {
        callback(JSON.parse('{"message":"/journey expects ?ref=REF"}'));
        return;
    }

    var nztaOptions = {
        host: 'infoconnect1.highwayinfo.govt.nz',
        port: 443,
        path: '/ic/jbi/SsdfJourney2/REST/FeedService/journey/' + query["ref"],
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

                callback(journey);
            });

        });

    });

};