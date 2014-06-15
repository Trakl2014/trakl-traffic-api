trackl-traffic-api
======
[![Build status](https://ci.appveyor.com/api/projects/status/vh49dcwj7i03qlme)](https://ci.appveyor.com/project/tharax/trakl-traffic-api)

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

Returns the current speed and time of journey, as well as up to ten historical data points.

###### Example Response:
```
{
    "name": "R04-NB - Dominion Rd",
    "averageSpeed": 41.86,
    "minutes": 9,
    "pollDateTime": "2014-06-14T11:21:02.983Z",
    "lastAverageSpeed": 43.36,
    "lastMinutes": 9,
    "lastPollDateTime": "2014-06-14T11:14:32.287Z",
    "journeys": [
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 41.86,
            "minutes": 9,
            "pollDateTime": "2014-06-14T11:21:02.983Z"
        },
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 43.36,
            "minutes": 9,
            "pollDateTime": "2014-06-14T11:14:32.287Z"
        },
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 43.68,
            "minutes": 9,
            "pollDateTime": "2014-06-14T11:11:20.370Z"
        },
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 43.59,
            "minutes": 9,
            "pollDateTime": "2014-06-14T11:05:12.677Z"
        },
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 43.4,
            "minutes": 9,
            "pollDateTime": "2014-06-14T10:59:00.023Z"
        },
        {
            "name": "R04-NB - Dominion Rd",
            "averageSpeed": 43.17,
            "minutes": 9,
            "pollDateTime": "2014-06-14T10:53:04.030Z"
        }
    ]
}
```
