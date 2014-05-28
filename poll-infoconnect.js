exports.pollJourney = function(reqUrl, callback) {
    var url = require('url');
    var azure = require('azure');
    var uuid = require('node-uuid');

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
        
        // The NTVS can't see the AppSettings, so if null, must be debugging, use Development Storage
        var tableService = process.env.StorageAccountName === undefined 
                           ? azure.createTableService("devstoreaccount1",
                                                       "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==",
                                                       "127.0.0.1:10002")
                           : azure.createTableService(process.env.StorageAccountName,
                                                       process.env.StorageAccountKey,
                                                       process.env.StorageAccountTableStoreHost);

        tableService.createTableIfNotExists('journey', function (error) {
            if (error) {
                callback(error);
                return;
            }

            // save latest journey
            journey.PartitionKey = ref;
            journey.RowKey = uuid.v4();

            tableService.insertEntity('journey', journey, function (insertError) {
                if (insertError) {
                    callback(insertError);
                    return;
                }

                deleteOldPollData(tableService, ref, journey.pollDateTime, function(err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, journey);
                });
            });
        });
    });
};

var deleteOldPollData = function (tableService, ref, pollDateTime, callback) {
    var azure = require('azure');
    
    var secondsBetweenPolls = 600;
    var numberOfPollsToKeep = 10;

    // delete all journeys > 10 * secondsBetweenPolls
    var oldestJourneyDateToKeep = pollDateTime;
    oldestJourneyDateToKeep.setSeconds(oldestJourneyDateToKeep.getSeconds() - (secondsBetweenPolls * numberOfPollsToKeep));

    var tableQuery = azure.TableQuery
        .select()
        .from('journey')
        .where('PartitionKey eq ?', ref)
        .where('pollDateTime lt ?', oldestJourneyDateToKeep);

    tableService.queryEntities(tableQuery, function(queryError, entities) {
        if (queryError) {
            callback(queryError);
            return;
        }

        for (var i = 0; i < entities.length; i++) {
            // entities
            tableService.deleteEntity('journey', {
                PartitionKey: entities[i].PartitionKey,
                RowKey: entities[i].RowKey
            }, function(deleteError) {
                if (deleteError) {
                    callback(deleteError);
                    return;
                }
            });
        }
        callback(null);
    });
};

var getNztaData = function (ref, callback) {
    var https = require('https');
    var xml2js = require('xml2js');

    // if no appsettings, then we must be debugging locally, mock out the data call and return stub data
    if (process.env.NztaUsername === undefined) {
        var fakeData = {
            name: "TEST-WB",
            averageSpeed: Math.random(1, 50),
            minutes: Math.random(5, 60),
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