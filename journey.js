exports.getJourneyData = function (reqUrl, callback) {
    var https = require('https');
    var xml2js = require('xml2js');
    var url = require('url');
    //var nodeCache = require("node-cache");
    var moment = require('moment');
    //var mongoose = require('mongoose'), Schema = mongoose.Schema;
    var azure = require('azure');
    //var ServiceClient = azure.ServiceClient;

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

//                // get from cache
//                var cache = new nodeCache();
//                cache.get(ref, function(cacheErr, cacheResult) {

                var tableService = azure.createTableService(process.env.StorageAccountName,
                    process.env.StorageAccountKey,
                    process.env.StorageAccountTableStoreHost);

                tableService.createTableIfNotExists('journey', function (error) {
                    if (error) {
                        throw 'Could not create table';
                    }

                    var query = azure.TableQuery
                        .select()
                        .from('journey')
                        .where('PartitionKey eq ?', 'journeys');

                    tableService.queryEntities(query, function (queryError, entities) {
                        if (queryError) {
                            throw 'Could not query entities';
                        }

                        var lastJourney;

                        if (entities.length == 0) {
                            lastJourney = {
                                PartitionKey: 'journeys',
                                RowKey: '1',
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
                                if (new Date(entities[i].pollDateTime) > maxPollDate) {
                                    maxPollDate = new Date(entities[i].pollDateTime);
                                    j = i;
                                }
                            }

                            lastJourney = entities[j];
                        }

                        var rowKey = new Number(lastJourney.RowKey);
                        rowKey += 1;

                        var journey = {
                            PartitionKey: 'journeys',
                            RowKey: rowKey.toString(),

                            name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],

                            averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0],
                            minutes: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0],
                            pollDateTime: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0],

                            //TODO:
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
                                throw 'Could not insert';
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
