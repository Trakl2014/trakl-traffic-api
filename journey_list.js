exports.getNames = function (filename, callback) {
	var fs = require('fs');

	fs.readFile(filename, function (err,data) {
		var parseString = require('xml2js').parseString;
		// console.log("data:" + data);
		console.log("I've got the data");
		parseString(data, function (err, result) {

			var journeys = [];
			for (var i = 0; i < result["tns:findAllJourneysResponse"]["tns:return"].length; i++) {
				console.log("l:" +result["tns:findAllJourneysResponse"]["tns:return"].length + "i:"+ i);

				if (!result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:name"]) continue;
				journey = {
					name: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:name"][0],
					ref: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:reference"][0],
				}
				journeys[i] = journey;
			}

			callback(JSON.stringify(journeys));
		});
	});
}