exports.getJourneyData = function (reqUrl, callback) {
    var url = require('url');
    var azure = require('azure');
    var Enumerable = require('linq');
    var repo = require('./journey-repository.js');

    var maxJourneysInHistory = 10; // see also numberOfPollsToKeep in poll-infoconnect.js

    var query = url.parse(reqUrl, true).query;
    var ref = query["ref"];

    if (!ref || ref == 'undefined') {
        callback(new Error("/journey expects ?ref=REF"));
        return;
    }

    var tableQuery = azure.TableQuery
        .select()
        .from('journey')
        .where('PartitionKey eq ?', ref);

    repo.get(tableQuery, function (error, entities) {
        if (error) {
            callback(error);
            return;
        }

        if (entities.length == 0) {
            callback(new Error('No data for journey ref ' + ref));
            return;
        }

        // wow - projection - thanks linq.js! Projecting here to strip the Table Storage fluff.
        var journeys = Enumerable.from(entities)
            .orderByDescending(function (e) { return e.pollDateTime; })
            .select(function (e) {
                return {
                    name: e.name,
                    averageSpeed: e.averageSpeed,
                    minutes: e.minutes,
                    pollDateTime: e.pollDateTime
                }
            })
            .take(maxJourneysInHistory)
            .toArray();

        // last journey = 2nd journey
        var lastJourney = (journeys.length > 1) ? journeys[1] : { averageSpeed: null, minutes: null, pollDateTime: null };

        var journeyData = {
            name: journeys[0].name,

            averageSpeed: journeys[0].averageSpeed,
            minutes: journeys[0].minutes,
            pollDateTime: journeys[0].pollDateTime,

            lastAverageSpeed: lastJourney.averageSpeed,
            lastMinutes: lastJourney.minutes,
            lastPollDateTime: lastJourney.pollDateTime,

            journeys: journeys
        };

        callback(null, journeyData);
    });
};
