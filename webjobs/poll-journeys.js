var http = require("http");

var pollJourneys = function() {
    //http://trackl-traffic-api.azurewebsites.net/journeys
    var journeysOptions = {
        host: 'trackl-traffic-api.azurewebsites.net',
        port: 80,
        path: '/journeys'
    };

    http.get(journeysOptions, function(journeysResponse) {
        var journeysData = '';
        journeysResponse.on('data', function(chunk) {
            // chunk response 
            journeysData += chunk;
            var message = "" + chunk;
            console.log('Received response of ' + message.length);
        });

        journeysResponse.on('end', function() {
            // final response, now process data
            console.log('response end.');
            var journeys = JSON.parse(journeysData);

            for (var i = 0; i < journeys.length; i++) {
                // poll journey
                var journeyOptions = {
                    host: 'trackl-traffic-api.azurewebsites.net',
                    port: 80,
                    path: '/pollJourney?ref=' + journeys[i].ref
                };

                http.get(journeyOptions, function(journeyResponse) {
                    journeyResponse.on('data', function(chunk) {
                        // chunk response 
                        var message = "" + chunk;
                        console.log('Received journey response of ' + message.length);
                    });

                    journeyResponse.on('end', function() {
                        console.log('journey response end.');
                    });
                });
            }
        });
    });
};

pollJourneys();