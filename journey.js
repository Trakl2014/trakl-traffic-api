exports.getJourneyData = function(reqUrl, callback) {
    var https = require('https');
    var xml2js = require('xml2js');
    var url = require('url');
    var moment = require('moment');
    var azure = require('azure');
    var uuid = require('node-uuid');

    var secondsBetweenPolls = 600;

    // request API data from NZTA
    //https://infoconnect1.highwayinfo.govt.nz/ic/jbi/SsdfJourney2/REST/FeedService/journey/R04-NB

    var query = url.parse(reqUrl, true).query;
    var ref = query["ref"];

    if (!ref || ref == 'undefined') {
        callback(JSON.parse('{"message":"/journey expects ?ref=REF"}'));
        return;
    }

    var nztaOptions = {
        host: 'infoconnect1.highwayinfo.govt.nz',
        port: 443,
        path: '/ic/jbi/SsdfJourney2/REST/FeedService/journey/' + ref,
        headers: {
            "username": "LeeB",
            "password": "H9r8z6w3g9"
        }
    };

    https.get(nztaOptions, function(nztaResponse) {
        var nztaData = '';

        nztaResponse.on('data', function(chunk) {
            // chunk response from NZTA
            nztaData += chunk;
            var message = "" + chunk;
            console.log('Received response of ' + message.length + ' bytes from nzta.');
        });

        nztaResponse.on('end', function() {
            // final response, now process data
            console.log('response end.');
            try {
                xml2js.parseString(nztaData, function(err, result) {
                    if (err) {
                        console.log('error in nztaResponse on.. line 48')
                    };
                    console.log(nztaData);
                    console.log('--------');
                    console.log(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0]);

                    var lastJourney = {
                        averageSpeed: "",
                        minutes: "",
                        pollDateTime: ""
                    };
                    var journey = {
                        // PartitionKey: ref,
                        // RowKey: uuid.v4(),

                        name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],
                        averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0],
                        minutes: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0],
                        pollDateTime: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0],
                        lastAverageSpeed: lastJourney.averageSpeed,
                        lastMinutes: lastJourney.minutes,
                        lastPollDateTime: lastJourney.pollDateTime
                    };
                    console.log(journey + " | " + lastJourney);
                    callback(journey);

                });
            } catch (e) {
                console.log('error in nztaResponse on' + e)
            }

        });
    });
};