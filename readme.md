# Astrometry.net API lite

A lite version of the Astrometry.net Nova API built with node.js. Its purpose is to provide an alternative lightweight API to the Astrometry.net full site and suite.

## NEW: Windows 10 Subsystem for Linux installer

To make life a lot easier for Windows users, an installation wizard now exists that installs the whole shebang with a few clicks!

[Skip straight to installation instructions.](#installation)

A test API is set up at http://astro-api.b5p.org (dashboard: [http://astro-api.b5p.org/dashboard](http://astro-api.b5p.org/dashboard)) if you wish to give it a spin ([swagger UI available](http://astro-api.b5p.org/swagger), note that from the swagger UI you can only use url upload, regular upload lacks UI). Don't use it for "production" purposes, the computing resources are very low and no service is guaranteed. It's merely a demo. It also may not be running the most recent version all the time.

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

The job of the API is simply to accept jobs and store them into a queue, and to serve the state of each job upon request. The jobs are stored in an SQLite database.

The API implements the following astrometry.net endpoints:

- /api/login
- /api/upload
- /api/url_upload
- /api/submissions
- /api/jobs/{id}
- /api/jobs/{id}/calibration
- /api/jobs/{id}/info
- /api/submissions/{id}

Additionally, the following endpoints are provided for management purposes:

- /api/stats/latest
- /api/stats/workers
- /api/stats/supports
- /api/result-images/annotation/{id}
- /api/result-images/objects/{id}
- /api/job-control/cancel/{id}

#### API Dashboard

To provide a bit more transparency, a simple dashboard has been implemented and is accessible at /dashboard. It's useful especially if you're running the API for your own use, and it allows you to cancel jobs if that is enabled from configuration.

The dashboard provides some basic information:

- The manager status (running/down)
- Active worker count
- Latest jobs (20 latest job entries) and their information
- The ability to cancel running and queued jobs if that feature is enabled.

The dashboard can be configured from the __API's configuration.json__, and these values enable/disable the features:
```
	"enableDashboard": true,
	"enableJobCancellationApi": true
```

If you do not with to use/expose the dashboard, you can disable it via the configuration.
When the job cancellation API is enabled, canceling jobs via the dashboard and the API is allowed. Useful for personal use, but you probably don't want it enabled if you provide the API for wider use.


### Manager

The job manager observes the job queue, and once it notices there's work to be done it spawns a worker to process the job. You can configure how many concurrent worker processes are allowed to be run. Basically the manager does its best to empty the queue by spawning worker processes.

### Worker

The worker does the actual processing. Once spawned, it reads the queue for the latest unprocessed item, tags it and runs the solver on it. Once work is completed, it updates the job with the results and exits.


## Installation

### Windows 10 installer

If you're running Windows 10 and would like to install this taking advantage of Windows 10 Subsystem for Linux, good news: __an installer exists that does all of it for you__!

[Head over to Releases to download it.](https://github.com/Jusas/astrometry-api-lite/releases)

### Releases

For Windows 10, the easiest way is to use the installer.

[Go to releases to download it](https://github.com/Jusas/astrometry-api-lite/releases).

### Install script

If you're running Ubuntu you can use the installation script provided in the install directory to run the install.

Go to/make the directory you want to install it into, then get the script and run it:

```
wget -q https://raw.githubusercontent.com/Jusas/astrometry-api-lite/master/installer/install.sh
chmod u+x install.sh
```

```
./install.sh <options>
```

Options being:
```
-l <0|1> -a <0|1> [-i <string>] -u <string> -p <num>
-s <0|1> -d <0|1> -c <0|1> -j <num> -o <0|1> -n <0|1>
-z <num>

Parameters:
<0|1> means no/yes, ie. '-l 1' means 'install api-lite'

  -l   install the latest api-lite package from github 
  -a   install astrometry.net package using apt-get
  -i   install astrometry.net index files, a comma separated
         string with index scale numbers, from 0 to 19,
         eg. '-i 4,5,6,7,8'. Optional parameter.
  -u   set upload directory in configuration
  -p   set port in configuration
  -s   enable Swagger UI in configuration
  -d   enable Dashboard in configuration
  -c   enable job canceling in Dashboard
  -j   set maximum concurrent jobs in configuration
  -o   enable detected objects image storing in configuration
  -n   enable annotation image storing in configuration
  -z   set stored image scaling factor in configuration

example: ./install.sh -l 1 -a 1 -i 19,18,17,16,15,14,13,12,11,10,9,8,7,6,5 -u /tmp/astro-upload -p 3000 -s 1 -d 1 -c 1 -j 4 -o 1 -n 1 -z 0.5
```

About the index numbering, see http://data.astrometry.net/4200/README

The script will install all required packages, provided that they're found and sets up astrometry.net for you. You should be all good to go when the script finishes.

### Manually from the sources

#### Prerequisites

Firstly, make sure you have Node.js installed. You'll want the latest stable version - an older version might work, but it has not been tested.

Secondly, make sure the astrometry.net solver is installed. If your Linux distro has the package, it should be easy. For Ubuntu for example, all you need to do is

```sudo apt-get install astrometry.net```

Additionally you'll also need the astrometry.net index files. Your Linux distro may have them as packages as well. Alternatively you can go [straight to the source](http://broiler.astrometry.net/~dstn/4200/) and download what you need.

#### Sources

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

If you're running this on native Linux (ie. NOT Windows 10 Subsystem for Linux) you can install this as a service.
This will depend on what your Linux distro is of course, but here's an example how to do it in Ubuntu:

In this repo you can find the files:
- astrometry-api-lite.service
- astrometry-api-lite-manager.service

Modify the `WorkingDirectory` and `ExecStart` directories to match your installation directory. Also make sure the `User` is set to the user you wish to run the service with (and that user should also have the proper rights to the installation directory). Then copy the files under /etc/systemd/system, enable the services and start them:

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

A few configuration values can be set for each application. The defaults may not be what you want, so check them out.

#### dist/api/configuration.json

| Key | Value |
|-----------------|---------------|
| database | the path to the SQLite database file where the queue and results are stored |
| queueFileUploadDir | the path where uploaded files are stored |
| apiPort | which port the API http server uses |
| enableSwagger | enables or disables the swagger UI, accessible at /swagger |
| enableDashboard | enables or disables the dashboard at /dashboard |
| enableJobCancellationApi | enables or disables the job cancellation api, /api/job-control/cancel/{id}. When disabled the control API just returns 403. |

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
| cleanTempUponCompletion | clean up temp files after solver finishes (default: true) |
| computationTimeLimit | the time limit for the solver, jobs that last longer will be aborted |
| skipJobsOlderThanSeconds | the worker will abandon jobs that are older than this value in seconds (useful if the API has piled up jobs but the manager has been down, you don't want to start solving old jobs) |
| storeObjsImages | true or false, whether or not you want to store the resulting object images for each job. Stores them in the job database in base64 format. |
| storeNgcImages | true or false, whether or not you want to store the resulting NGC (annotation) images for each job. Stores them in the job database in base64 format. |
| imageScale | Image scaling to apply to the saved images (if you want to save space) |

### Data storage

All the data (excluding temporary files) is stored in a single table in an SQLite database. This is due to wanting to keep things simple - any other database solution would work just as well, even better, and when moving on to a distributed model where workers do not sit in the same place as the API/manager does a more robust solution will be needed - most likely an SQL server of some kind. 

Saving images (objects/star detection and annotations) from solver can be enabled/disabled from configuration, as explained above. If you have no need for the images and want to save space, just disable storing them.

No cleanup duties are being performed for the database. It's important to note that the database is by its nature "expendable", ie. since the job of the API is to serve requests for the needs of this very moment and not to keep the results for later use, the data is only relevant for a brief moment. Therefore wiping/resetting the database with the template copy (you can find `workdb-template.db` in the sources) should be ok to do at any time.

## Supported environments

The basic need is to be able to run Node.js applications and the astrometry.net solver. If you can do those, you've got what you need.

__NOTE:__ It's important to note that __Debian based distributions will not have any NGC objects in their annotations__ if you've installed astrometry.net from their packages; this is due to the non-commercial license requirements to use those object catalogs, and Debian has had to remove that data - you'll probably need to jump through some hoops and compile astrometry.net yourself if you want them in.

This has been tested in both **Windows 10 Subsystem for Linux** and in **Ubuntu 16.04**.

