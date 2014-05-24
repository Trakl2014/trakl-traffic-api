trackl-traffic-api
======

A simple API for querying interesting data about the Auckland traffic network.


## API Functions

#### Get Journey List

`/journeys`

###### Example Response:


    [
        {
            "name": "R87-NB - Queen Street",
            "ref": "R87-NB",
            "startLat": "-36.850891",
            "startLong": "174.764511",
            "endLat": "-36.844677",
            "endLong": "174.766663"
        },
        {
            "name": "R87-SB - Queen Street",
            "ref": "R87-SB",
            "startLat": "-36.844677",
            "startLong": "174.766663",
            "endLat": "-36.850891",
            "endLong": "174.764511"
        }
    ]

#### Get Specific Journey Detail

`/journey?ref=R87-NB`

###### Example Response:

    {
        "PartitionKey": "journeys",
        "RowKey": "69caacb7-0547-4a50-88cc-7ba8d6a0e064",
        "name": "R87-NB - Queen Street",
        "averageSpeed": "11.97",
        "minutes": "4",
        "pollDateTime": "2014-05-25T01:05:00.767+12:00",
        "lastAverageSpeed": "47.67",
        "lastMinutes": "24",
        "lastPollDateTime": "2014-05-24T23:31:59.377+12:00"
    }