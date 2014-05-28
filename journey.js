exports.getJourneyData = function (reqUrl, callback) {
    var https = require('https');
    var xml2js = require('xml2js');
    var url = require('url');
    var azure = require('azure');
    var uuid = require('node-uuid');
    var Enumerable = require('linq');

    var secondsBetweenPolls = 600;
    var numberOfPollsToKeep = 10;
    
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
//            "username": process.env.NztaUsername,
            //            "password": process.env.NztaPassword
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

                // The NTVS can't see the AppSettings 

//                var tableService = azure.createTableService(process.env.StorageAccountName,
//                    process.env.StorageAccountKey,
//                    process.env.StorageAccountTableStoreHost);

                var tableService = azure.createTableService("trakltraffic",
                    "LNQZyv2A2SKzOteeYgeFn4CzDusdhpz1InndzBwZsx3NbyEPQH79jtJEn4yUOXWUcTWV7paEHDSqAWO9sbQ/ZA==",
                    "trakltraffic.table.core.windows.net");

                tableService.createTableIfNotExists('journey', function (error) {
                    if (error) {
                        throw 'Could not create table: ' + error;
                    }

                    var tableQuery = azure.TableQuery
                        .select()
                        .from('journey')
                        .where('PartitionKey eq ?', ref);

                    tableService.queryEntities(tableQuery, function (queryError, entities) {
                        if (queryError) {
                            throw 'Could not query entities: ' + queryError;
                        }

                        var lastJourney;

                        if (entities.length == 0) {
                            lastJourney = {
                                PartitionKey: ref,
                                RowKey: uuid.v4(),
                                averageSpeed: "",
                                minutes: "",
                                pollDateTime: ""
                            };
                        } else {
                            // get any journeys older than secondsBetweenPolls and delete all but the earliest one
                            var lastPollDate = new Date(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0]);
                            lastPollDate.setSeconds(lastPollDate.getSeconds() - secondsBetweenPolls);

                            var oldJourneys = Enumerable.from(entities)
                              .where(function (e) { return new Date(e.pollDateTime) <= lastPollDate; })
                              .orderByDescending(function (e) { return new Date(e.pollDateTime); })
                              .toArray();


//                            var minPollDate;
//                            var oldJourneys = [];
//                            var j = 0;
//                            for (var i = 0; i < entities.length; i++) {
//                                if (new Date(entities[i].pollDateTime) <= lastPollDate) {
//                                    if (minPollDate === undefined || new Date(entities[i].pollDateTime) > minPollDate) {
//                                        minPollDate = new Date(entities[i].pollDateTime);
//                                    }
//                                    oldJourneys[j] = entities[i];
//                                    j++;
//                                }
//                            }

                            // delete all journeys > 10 * secondsBetweenPolls
                            var oldestJourneyDateToKeep = new Date(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0]);
                            oldestJourneyDateToKeep.setSeconds(lastPollDate.getSeconds() - (secondsBetweenPolls * numberOfPollsToKeep));

                            var journeysToDelete = Enumerable.from(entities)
                              .where(function (e) { return new Date(e.pollDateTime) <= oldestJourneyDateToKeep; })
                              .toArray();

                            for (i = 0; i < journeysToDelete.length; i++) {
                                // delete
//                                tableService.deleteEntity('journey', {
//                                    PartitionKey: journeysToDelete[i].PartitionKey,
//                                    RowKey: journeysToDelete[i].RowKey
//                                    }, function (deleteError) {
//                                        if (deleteError) {
//                                            throw deleteError;
//                                        }
//                                });
                            }

                            
//                            var maxPollDate;
//                            j = 0;
//                            for (i = 0; i < entities.length; i++) {
//                                if (!maxPollDate) {
//                                    maxPollDate = new Date(entities[i].pollDateTime);
//                                    j = i;
//                                    continue;
//                                }
//                                if (new Date(entities[i].pollDateTime) < maxPollDate) {
//                                    maxPollDate = new Date(entities[i].pollDateTime);
//                                    j = i;
//                                }
//                            }
                            // last journey = 2nd journey
                            if (oldJourneys.length > 1) {
                                lastJourney = oldJourneys[1];
                            }
                            else {
                                lastJourney = {
                                PartitionKey: ref,
                                RowKey: uuid.v4(),
                                averageSpeed: "",
                                minutes: "",
                                pollDateTime: ""
                                };
                            }
                        }

                        var journey = {
                            PartitionKey: ref,
                            RowKey: uuid.v4(),

                            name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],

                            averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0],
                            minutes: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0],
                            pollDateTime: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0],

                            lastAverageSpeed: lastJourney.averageSpeed,
                            lastMinutes: lastJourney.minutes,
                            lastPollDateTime: lastJourney.pollDateTime
                        };

                        // save latest journey
//                        tableService.insertEntity('journey', journey, function (insertError) {
//                            if (insertError) {
//                                throw 'Could not insert:' + insertError;
//                            }
//
//                            // Entity inserted
//                            callback(journey);
//                        });
                    });
                });
            });
        });
    });
};
