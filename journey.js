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

            xml2js.parseString(nztaData, function(err, result) {
                console.log(nztaData);
                console.log('--------');
                console.log(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0]);

                //     var tableService = azure.createTableService(process.env.StorageAccountName,
                //         process.env.StorageAccountKey,
                //         process.env.StorageAccountTableStoreHost);

                //     tableService.createTableIfNotExists('journey', function (error) {
                //         if (error) {
                //             throw 'Could not create table: ' + error;
                //         }

                //         var query = azure.TableQuery
                //             .select()
                //             .from('journey')
                //             .where('PartitionKey eq ?', ref);

                //         tableService.queryEntities(query, function (queryError, entities) {
                //             if (queryError) {
                //                 throw 'Could not query entities: ' + queryError;
                //             }

                //             var lastJourney;

                //             if (entities.length == 0) {
                //                 lastJourney = {
                //                     PartitionKey: ref,
                //                     RowKey: uuid.v4(),
                //                     averageSpeed: "",
                //                     minutes: "",
                //                     pollDateTime: ""
                //                 };
                //             } else {
                //                 // get any journeys older than secondsBetweenPolls and delete all but the earliest one
                //                 var lastPollDate = new Date(result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0]);
                //                 lastPollDate.setSeconds(lastPollDate.getSeconds() - secondsBetweenPolls);

                //                 var minPollDate;
                //                 var oldJourneys = [];
                //                 var j = 0;
                //                 for (var i = 0; i < entities.length; i++) {
                //                     if (new Date(entities[i].pollDateTime) <= lastPollDate) {
                //                         if (minPollDate === undefined || new Date(entities[i].pollDateTime) > minPollDate) {
                //                             minPollDate = new Date(entities[i].pollDateTime);
                //                         }
                //                         oldJourneys[j] = entities[i];
                //                         j++;
                //                     }
                //                 }

                //                 // delete all but earliest >= lastPollDate journey 
                //                 for (i = 0; i < oldJourneys.length; i++) {
                //                     if (oldJourneys[i].pollDateTime == minPollDate) continue;

                //                     // delete
                //                     tableService.deleteEntity('journey', {
                //                         PartitionKey: oldJourneys[i].PartitionKey,
                //                         RowKey: oldJourneys[i].RowKey
                //                     }, function (deleteError) {
                //                         if (deleteError) {
                //                             throw deleteError;
                //                         }
                //                     });
                //                 }

                //                 // find the oldest journey
                //                 var maxPollDate;
                //                 j = 0;
                //                 for (i = 0; i < entities.length; i++) {
                //                     if (!maxPollDate) {
                //                         maxPollDate = new Date(entities[i].pollDateTime);
                //                         j = i;
                //                         continue;
                //                     }
                //                     if (new Date(entities[i].pollDateTime) < maxPollDate) {
                //                         maxPollDate = new Date(entities[i].pollDateTime);
                //                         j = i;
                //                     }
                //                 }

                //                 lastJourney = entities[j];
                //             }

                var journey = {
                    // PartitionKey: ref,
                    // RowKey: uuid.v4(),

                    name: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:name"][0],
                    averageSpeed: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:averageSpeed"][0],
                    minutes: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimate"][0],
                    pollDateTime: result["tns:findJourneyByReferenceResponse"]["tns:return"][0]["tns:lastEstimateTime"][0]
                    // lastAverageSpeed: lastJourney.averageSpeed,
                    // lastMinutes: lastJourney.minutes,
                    // lastPollDateTime: lastJourney.pollDateTime
                };
                console.log(journey);
                callback(journey);

                //             // save latest journey
                //             tableService.insertEntity('journey', journey, function (insertError) {
                //                 if (insertError) {
                //                     throw 'Could not insert:' + insertError;
                //                 }

                //                 // Entity inserted
                //                 callback(journey);
                //             });
                //         });
                //     });
            });
        });
    });
};