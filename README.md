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
            "ref": "R87-NB"
        },
        {
            "name": "R87-SB - Queen Street",
            "ref": "R87-SB"
        }
    ]

#### Get Specific Journey Detail

`/journey?ref=R87-NB`

###### Example Response:

    {
		"name":"R87-NB - Queen Street",
		"averageSpeed":"11.37"
    }