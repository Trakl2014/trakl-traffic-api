exports.getJourneyData = function (reqUrl, callback) {
    var https = require('https');
    var xml2js = require('xml2js');
    var url = require('url');
    var moment = require('moment');
    var azure = require('azure');
    var uuid = require('node-uuid');

    var lastPollSeconds = 600;
    
    // request API data from NZTA
    //https://infoconnect1.highwayinfo.govt.nz/ic/jbi/SsdfJourney2/REST/FeedService/journey/R04-NB

    var query = url.parse(reqUrl, true).query;
    var ref = query["ref"];

    if (!ref) {
        callback(JSON.parse('{"message":"/journey expects ?ref=REF"}'));
        return;
    }

    var nztaOptions = {
        host: 'infoconnect1.highwayinfo.govt.nz',
        port: 443,
        path: '/ic/jbi/SsdfJourney2/REST/FeedService/journey/' + ref,
        headers: {
            "username": process.env.NztaUsername,
            "password": process.env.NztaPassword
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

                var tableService = azure.createTableService(process.env.StorageAccountName,
                    process.env.StorageAccountKey,
                    process.env.StorageAccountTableStoreHost);

                tableService.createTableIfNotExists('journey', function (error) {
                    if (error) {
                        throw 'Could not create table: ' + error;
                    }

                    var query = azure.TableQuery
                        .select()
                        .from('journey')
                        .where('PartitionKey eq ?', 'journeys');

                    tableService.queryEntities(query, function (queryError, entities) {
                        if (queryError) {
                            throw 'Could not query entities: ' + queryError;
                        }

                        var lastJourney;

                        if (entities.length == 0) {
                            lastJourney = {
                                PartitionKey: 'journeys',
                                RowKey: uuid.v4(),
                                averageSpeed: "",
                                minutes: "",
                                pollDateTime: ""
                            };
                        } else {
                            // find the oldest journey
                            var maxPollDate;
                            var j = 0;
                            for (var i = 0; i < entities.length; i++) {
                                if (!maxPollDate) {
                                    maxPollDate = new Date(entities[i].pollDateTime);
                                    j = i;
                                    continue;
                                }
                                if (new Date(entities[i].pollDateTime) < maxPollDate) {
                                    maxPollDate = new Date(entities[i].pollDateTime);
                                    j = i;
                                }
                            }

                            lastJourney = entities[j];
                        }

                        var journey = {
                            PartitionKey: 'journeys',
                            RowKey: uuid.v4(),

                            name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],

                            averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0],
                            minutes: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0],
                            pollDateTime: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0],

                            lastAverageSpeed: lastJourney.averageSpeed,
                            lastMinutes: lastJourney.minutes,
                            lastPollDateTime: lastJourney.pollDateTime
                        };

                        // cache the last poll...
                        //  if none in cache
                        //  -or- last poll is older than 

                        //var pollDate = new Date(journey.pollDateTime);
                        //var dateKey = moment(pollDate).format("YYYYMMDDHHmm");

                        // add latest journey and add back to cache

                        // save new journey
                        tableService.insertEntity('journey', journey, function (insertError) {
                            if (insertError) {
                                throw 'Could not insert:' + insertError;
                            }

                            // Entity inserted
                            callback(journey);
                        });
                    });
                });
            });
        });
    });
};
