trackl-traffic-api
==================

A simple API for querying interesting data about the Auckland traffic network.


### API Methods  - This definitely needs to be made prettier###

Append these to your call to the website. examples use localhost

**Get a list of all Journeys**
localhost:3000`/journeys`

Returns:

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

**Get details about a particular journey**
localhost:3000`/journey?ref=`R87-NB

Returns:

{"name":"R87-NB - Queen Street","averageSpeed":"11.37"}