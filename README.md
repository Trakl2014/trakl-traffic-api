trackl-traffic-api
======
[![Build status](https://ci.appveyor.com/api/projects/status/ahgws3we9dq77xph)](https://ci.appveyor.com/project/tharax/trackl-traffic-api)

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

`/journey?ref=R26-NB`

###### Example Response:
```
{
    "PartitionKey": "R26-NB",
    "RowKey": "060ad8c8-b7fd-420c-8cd4-695131f823de",
    "name": "R26-NB - Devonport to Tristram Rd",
    "averageSpeed": "38.61",
    "minutes": "14",
    "pollDateTime": "2014-05-25T09:20:16.240+12:00",
    "lastAverageSpeed": "36.31",
    "lastMinutes": "15",
    "lastPollDateTime": "2014-05-25T09:09:10.773+12:00"
}
```
