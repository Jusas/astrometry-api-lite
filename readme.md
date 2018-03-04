# Astrometry.net API lite

A lite version of the Astrometry.net Nova API built with node.js. Its purpose is to provide an alternative lightweight API to the Astrometry.net full site and suite.

[Skip straight to installation instructions.](#installation)

A test API is set up at http://astro-api.b5p.org if you wish to give it a spin ([swagger UI available](http://astro-api.b5p.org/swagger), note that from the swagger UI you can only use url upload, regular upload lacks UI). Don't use it for "production" purposes, the computing resources aren't very high and no service is guaranteed.

## Why?

People use Astrometry.net Nova (henceforth Nova) for different purposes. One use for it is to simply use it as a plate solver for different astronomy/astrophotography applications. In those cases, there's no real need for Nova's other features, as the applications are only interested in the raw plate solving data provided by the actual solver beneath. Perhaps you'd like to set up a solver for yourself, or for a group of people, and/or have it only accessible in your private network, and/or you need the API because some software interfaces with it. Perhaps sometimes Nova is down, and you're unable to use the API they provide. For these cases, the API lite is meant as an alternative solution.

## Philosophy

The API lite is meant to to be a pure API, with no added fluff on top of it. It follows the Astrometry.net API specs in order to be cross-compatible. Therefore while some things are not really implemented in the lite API, such as sessions or logins, the API for them still exists and returns sane values.

The ease of installation and adoptation was priority. It's easy to use, and it has been built from three components - API, manager and worker processes - in order to make it possible to fulfill distributed deployment scenarios later on. Currently support only exists to run everything on a single machine. However plans are to extend this to be scalable and distributed if needed, and to process jobs on-demand.

## Architecture

The project is currently composed of three main parts:

1. API
2. Job manager
3. Worker

### API

The API implements the following endpoints:

- /api/login
- /api/upload
- /api/url_upload
- /api/submissions
- /api/jobs/{id}
- /api/jobs/{id}/calibration
- /api/jobs/{id}/info
- /api/submissions/{id}

The job of the API is simply to accept jobs and store them into a queue, and to serve the state of each job upon request. The jobs are stored in an SQLite database.

### Manager

The job manager observes the job queue, and once it notices there's work to be done it spawns a worker to process the job. You can configure how many concurrent worker processes are allowed to be run. Basically the manager does its best to empty the queue by spawning worker processes.

### Worker

The worker does the actual processing. Once spawned, it reads the queue for the latest unprocessed item, tags it and runs the solver on it. Once work is completed, it updates the job with the results and exits.


## Installation

### Prerequisites

Firstly, make sure you have Node.js installed. You'll want the latest stable version - an older version might work, but it has not been tested.

Secondly, make sure the astrometry.net solver is installed. If your Linux distro has the package, it should be easy. For Ubuntu for example, all you need to do is

```sudo apt-get install astrometry.net```

Additionally you'll also need the astrometry.net index files. Your Linux distro may have them as packages as well. Alternatively you can go [straight to the source](http://broiler.astrometry.net/~dstn/4200/) and download what you need.

### Installing the package

[Download the zip](https://github.com/Jusas/astrometry-api-lite/archive/master.zip) or clone the repo:

```git clone https://github.com/Jusas/astrometry-api-lite.git```

Then install the prerequisites and build the project:

```
npm install
npm run all:build
```

Now you're ready to run the apps.

To run the API:

```
node dist/api/server.js
```

To run the manager:

```
node dist/manager/main.js
```

To run a worker manually (normally not required, as the manager will spawn these when there are jobs in the queue):

```
node dist/worker/main.js
```

### Install as service

This will depend on what your Linux distro is of course, but here's an example how to do it in Ubuntu:

In this repo you can find the files:
- astrometry-api-lite.service
- astrometry-api-lite-manager.service

Modify the `WorkingDirectory` and `ExecStart` directories to match your installation directory. Also make sure the `User` is set to the user you wish to run the service with (and that user should also have the proper rights to the installation directory). Then copy the files under /etc/systemd/system:

```
sudo cp astrometry-api-lite*.service /etc/systemd/system
sudo systemctl enable astrometry-api-lite.service
sudo systemctl enable astrometry-api-lite-manager.service
sudo service astrometry-api-lite start
sudo service astrometry-api-lite-manager start
```

Now, if you run

```
service astrometry-api-lite status
service astrometry-api-lite-manager status
```

you should see the service statuses, and if all is correct they should be active.

If you make modifications later on to the files, remember to run `sudo systemctl daemon-reload` to reload the service configurations.

### Configuring

A few configuration values can be set for each application.

#### dist/api/configuration.json

| Key | Value |
|-----------------|---------------|
| database | the path to the SQLite database file where the queue and results are stored |
| queueFileUploadDir | the path where uploaded files are stored |
| apiPort | which port the API http server uses |
| enableSwagger | enables or disables the swagger UI, accessible at /swagger |

In addition you can use the environment variable `AAPI_LITE_ENV` to load a different configuration file if you want. Ie. calling

```
AAPI_LITE_ENV=local node dist/api/server.js
```

will load `configuration.local.json` file instead.

**Note:** If you wish to run this at port 80, you'll either need to run this as root (sudo) or run this behind something like nginx reverse proxy, with nginx forwarding its port 80 to your configured port.

#### dist/manager/configuration.json

| Key | Value |
|-----------------|---------------|
| database | the path to the SQLite database file where the queue and results are stored |
| worker | the path to the worker application |
| maxConcurrentWorkers | how many concurrent workers are allowed to be spawned |

#### dist/worker/configuration.json

| Key | Value |
|-----------------|---------------|
| database | the path to the SQLite database file where the queue and results are stored |
| queueFileUploadDir | the path where uploaded files are stored |
| tempDir | the path where (temporary) result files produced by the solver are stored |
| computationTimeLimit | the time limit for the solver, jobs that last longer will be aborted |

### Data storage

All the data (excluding temporary files) is stored in a single table in an SQLite database. This is due to wanting to keep things simple - any other database solution would work just as well, even better, and when moving on to a distributed model where workers do not sit in the same place as the API/manager does a more robust solution will be needed - most likely an SQL server of some kind. 

No cleanup duties are being performed for the database. It's important to note that the database is by its nature "expendable", ie. since the job of the API is to serve requests for the needs of this very moment and not to keep the results for later use, the data is only relevant for a brief moment. Therefore wiping/resetting the database with the template copy (you can find `workdb-template.db` in the sources) should be ok to do at any time.

## Supported environments

The basic need is to be able to run Node.js applications and the astrometry.net solver. If you can do those, you've got what you need.

This has been tested in both **Windows 10 Subsystem for Linux** and in **Ubuntu 16.04**.



