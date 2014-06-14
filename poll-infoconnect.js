exports.pollJourney = function(reqUrl, callback) {
    var url = require('url');
    var uuid = require('node-uuid');
    var repo = require('./journey-repository.js');

    var query = url.parse(reqUrl, true).query;
    var ref = query["ref"];

    if (!ref || ref == 'undefined') {
        callback(new Error("/pollJourney expects ?ref=REF"));
        return;
    }

    // get the data
    getNztaData(ref, function(err, journey) {
        if (err) {
            callback(err);
            return;
        }
        
        // save latest journey
        journey.PartitionKey = ref;
        journey.RowKey = uuid.v4();

        repo.insert(journey, function(error) {
            if (error) {
                callback(error);
                return;
            }

            deleteOldPollData(ref, journey.pollDateTime, function (error) {
                if (error) {
                    callback(error);
                    return;
                }
                callback(null, journey);
            });
        });
    });
};

var deleteOldPollData = function (ref, pollDateTime, callback) {
    var azure = require('azure');
    var repo = require('./journey-repository.js');

    var secondsBetweenPolls = 300;
    var numberOfPollsToKeep = 10;

    // delete all journeys > 10 * secondsBetweenPolls
    var oldestJourneyDateToKeep = new Date(pollDateTime);
    oldestJourneyDateToKeep.setSeconds(oldestJourneyDateToKeep.getSeconds() - (secondsBetweenPolls * numberOfPollsToKeep));

    var tableQuery = azure.TableQuery
        .select()
        .from('journey')
        .where('PartitionKey eq ?', ref)
        .and('pollDateTime lt ?', oldestJourneyDateToKeep);

    repo.get(tableQuery, function(error, entities) {
        if (error) {
            callback(error);
            return;
        }

        deleteEntities(repo, entities, function(error) {
            if (error) {
                callback(error);
                return;
            }
            callback(null);
        });
    });
};

// recursively delete expired entities
var deleteEntities = function(repo, entities, callback) {
    console.log("deleting " + entities.length + " journeys");
    var entity = entities.pop();

    if (entity == undefined) {
        // no more
        callback(null);
        return;
    }

    console.log("deleting " + entity.PartitionKey + " " + entity.RowKey);

    repo.delete(entity, function (error) {
        if (error) {
            callback(error);
            return;
        }

        deleteEntities(repo, entities, callback);
    });
}

var getNztaData = function (ref, callback) {
    var https = require('https');
    var xml2js = require('xml2js');

    // if no appsettings, then we must be debugging locally, mock out the data call and return stub data
    if (process.env.NztaUsername === undefined) {
        var fakeData = {
            name: "This is a TEST - " + ref,
            averageSpeed: Math.round(Math.random() * 50),
            minutes: Math.round(Math.random() * 30),
            pollDateTime: new Date(),
        };
        callback(null, fakeData);
        return;
    }

    // request API data from NZTA
    var nztaOptions = {
        host: 'infoconnect1.highwayinfo.govt.nz',
        port: 443,
        path: '/ic/jbi/SsdfJourney2/REST/FeedService/journey/' + ref,
        headers: {
            "username": process.env.NztaUsername,
            "password": process.env.NztaPassword
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

            xml2js.parseString(nztaData, function(err, result) {
                // result = json

                if (result == null || result["tns:findJourneyByReferenceResponse"] == null || result["tns:findJourneyByReferenceResponse"]["tns:return"] == null
                    || result["tns:findJourneyByReferenceResponse"]["tns:return"].length == 0) {
                    callback(new Error("Call to NZTA returned no Data."));
                    return;
                }

                var data = {
                    name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],
                    averageSpeed: new Number(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0]),
                    minutes: new Number(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0]),
                    pollDateTime: new Date(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0])
                };
                callback(null, data);
                return;
            });
        });
    });
}