exports.getNames = function (filename, callback) {
	var fs = require('fs');

	fs.readFile(filename, function (err,data) {
		var parseString = require('xml2js').parseString;
		console.log("I've got the data (from the XML file)");
		parseString(data, function (err, result) {

			var journeys = [];
			for (var i = 0; i < result["tns:findAllJourneysResponse"]["tns:return"].length; i++) {
				// console.log("length: " +result["tns:findAllJourneysResponse"]["tns:return"].length + " i: "+ i);

				if (!result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:name"]) continue;
				journey = {
					name: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:name"][0],
					ref: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:reference"][0],
					startLat: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"][0]["tns:startLocation"][0]["tns:latitude"][0],
					startLong: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"][0]["tns:startLocation"][0]["tns:longitude"][0],
					endLat: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"][result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"].length - 1]["tns:endLocation"][0]["tns:latitude"][0],
					endLong: result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"][result["tns:findAllJourneysResponse"]["tns:return"][i]["tns:segments"].length - 1]["tns:endLocation"][0]["tns:longitude"][0]
				}
				journeys[i] = journey;
			}

			callback(JSON.stringify(journeys));
		});
	});
}