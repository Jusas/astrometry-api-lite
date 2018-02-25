# Astrometry.net API lite

A lite version of the Astrometry.net Nova API built with node.js. Its purpose is to provide an alternative lightweight API to the Astrometry.net full site and suite.

## Note: Work in progress!

**This is very much still work in progress, and not ready for any use.**

## Why?

People use Astrometry.net Nova (henceforth Nova) for different purposes. One use for it is to simply use it as a plate solver for different astronomy/astrophotography applications. In those cases, there's no real need for Nova's other features, as the applications are only interested in the raw plate solving data provided by the actual solver beneath. Perhaps you'd like to set up a solver for yourself, a group of people, and/or have it only accessible in your private network, and/or you need the API because some software interfaces with it. Perhaps sometimes Nova is down, and you're unable to use the API they provide. For these cases, the API lite is meant as an alternative solution.

## Philosophy

The API lite is meant to to be a pure API, with no added fluff on top of it. It follows the Astrometry.net API specification in order to be cross-compatible. Therefore while some things are not implemented in the lite API, such as sessions or logins, the API for them still exists and returns sane values.

The ease of installation and use is priority. It should be easy to use, yet flexible enough to fulfill distributed deployment scenarios when desired. The API and workers will primarily be aimed to be used from a single computer or container. However plans are to extend this to be scalable and distributed if needed, and to process jobs on-demand.

The project is currently composed of two main parts:

1. The API
2. The process worker

The flow is pretty straightforward: the API takes in requests and saves them as queue items for processing. Workers then process the queue, and write results to the database. 

The data is stored in a SQLite3 database - this is again due to the ease of installation and maintenance. The data is also largely just a job/result cache, and long term storage is not considered a goal in this case. The data is considered expendable.



