/* tslint:disable */

import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';

import { LoginController } from './../../controllers/login';
import { UploadController } from './../../controllers/upload';
import { UrlUploadController } from './../../controllers/url-upload';
import { SubmissionsController } from './../../controllers/submissions';
import { JobsController } from './../../controllers/jobs';
import { StatsController } from './../../controllers/stats';
import { ResultImageController } from './../../controllers/result-images';
import { JobControlController } from './../../controllers/jobcontrol';
import { ConfigEditController } from './../../controllers/configedit';

import { asyncErrorHandler } from '../../middleware/error-handler';


const models: TsoaRoute.Models = {
    "LoginResponse": {
        "properties": {
            "status": { "dataType": "string", "required": true },
            "message": { "dataType": "string", "required": true },
            "session": { "dataType": "string", "required": true },
        },
    },
    "LoginRequest": {
        "properties": {
            "apikey": { "dataType": "string", "required": true },
        },
    },
    "LoginRequestWrapper": {
        "properties": {
            "request-json": { "ref": "LoginRequest", "required": true },
        },
    },
    "UploadProcessingStatus": {
        "enums": ["success", "error"],
    },
    "UploadResponse": {
        "properties": {
            "status": { "ref": "UploadProcessingStatus", "required": true },
            "subid": { "dataType": "double", "required": true },
            "hash": { "dataType": "string", "required": true },
        },
    },
    "Consent": {
        "enums": ["y", "n"],
    },
    "ConsentLicenseExpanded": {
        "enums": ["y", "n", "d", "sa"],
    },
    "ConsentWithDefault": {
        "enums": ["y", "n", "d"],
    },
    "ScaleUnits": {
        "enums": ["degwidth", "arcminwidth", "arcsecperpix"],
    },
    "ScaleType": {
        "enums": ["ul", "ev"],
    },
    "UploadRequest": {
        "properties": {
            "scale_units": { "ref": "ScaleUnits" },
            "scale_type": { "ref": "ScaleType" },
            "scale_lower": { "dataType": "double" },
            "scale_upper": { "dataType": "double" },
            "scale_est": { "dataType": "double" },
            "scale_err": { "dataType": "double", "validators": { "minimum": { "value": 0 }, "maximum": { "value": 100 } } },
            "center_ra": { "dataType": "double", "validators": { "minimum": { "value": 0 }, "maximum": { "value": 360 } } },
            "center_dec": { "dataType": "double", "validators": { "minimum": { "value": -90 }, "maximum": { "value": 90 } } },
            "radius": { "dataType": "double" },
            "downsample_factor": { "dataType": "double", "validators": { "minimum": { "value": 0 } } },
            "tweak_order": { "dataType": "double" },
            "crpix_center": { "dataType": "boolean" },
            "parity": { "dataType": "double" },
            "positional_error": { "dataType": "double" },
            "session": { "dataType": "string" },
            "publicly_visible": { "ref": "Consent" },
            "allow_modifications": { "ref": "ConsentLicenseExpanded" },
            "allow_commercial_use": { "ref": "ConsentWithDefault" },
        },
    },
    "UploadRequestWrapper": {
        "properties": {
            "request-json": { "ref": "UploadRequest", "required": true },
        },
    },
    "UrlUploadRequest": {
        "properties": {
            "scale_units": { "ref": "ScaleUnits" },
            "scale_type": { "ref": "ScaleType" },
            "scale_lower": { "dataType": "double" },
            "scale_upper": { "dataType": "double" },
            "scale_est": { "dataType": "double" },
            "scale_err": { "dataType": "double", "validators": { "minimum": { "value": 0 }, "maximum": { "value": 100 } } },
            "center_ra": { "dataType": "double", "validators": { "minimum": { "value": 0 }, "maximum": { "value": 360 } } },
            "center_dec": { "dataType": "double", "validators": { "minimum": { "value": -90 }, "maximum": { "value": 90 } } },
            "radius": { "dataType": "double" },
            "downsample_factor": { "dataType": "double", "validators": { "minimum": { "value": 0 } } },
            "tweak_order": { "dataType": "double" },
            "crpix_center": { "dataType": "boolean" },
            "parity": { "dataType": "double" },
            "positional_error": { "dataType": "double" },
            "url": { "dataType": "string", "required": true },
        },
    },
    "UrlUploadRequestWrapper": {
        "properties": {
            "request-json": { "ref": "UrlUploadRequest", "required": true },
        },
    },
    "SubmissionInfoResponse": {
        "properties": {
            "processing_started": { "dataType": "string", "required": true },
            "job_calibrations": { "dataType": "array", "array": { "dataType": "double" }, "required": true },
            "jobs": { "dataType": "array", "array": { "dataType": "double" }, "required": true },
            "processing_finished": { "dataType": "string", "required": true },
            "user": { "dataType": "double", "required": true },
            "user_images": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
        },
    },
    "JobStatusResponseStatus": {
        "enums": ["none", "success", "solving", "failure"],
    },
    "JobStatusResponse": {
        "properties": {
            "status": { "ref": "JobStatusResponseStatus", "required": true },
        },
    },
    "JobCalibrationResponse": {
        "properties": {
            "parity": { "dataType": "double", "required": true },
            "orientation": { "dataType": "double", "required": true },
            "pixscale": { "dataType": "double", "required": true },
            "radius": { "dataType": "double", "required": true },
            "ra": { "dataType": "double", "required": true },
            "dec": { "dataType": "double", "required": true },
        },
    },
    "JobInfoResponse": {
        "properties": {
            "status": { "ref": "JobStatusResponseStatus", "required": true },
            "calibration": { "ref": "JobCalibrationResponse", "required": true },
            "machine_tags": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
            "tags": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
            "original_filename": { "dataType": "string", "required": true },
            "objects_in_field": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
        },
    },
    "ApiSupports": {
        "properties": {
            "jobCancellationSupported": { "dataType": "boolean", "required": true },
            "configEditingSupported": { "dataType": "boolean", "required": true },
        },
    },
    "JobQueueEntryWithThumbs": {
        "properties": {
            "result_parity": { "dataType": "double", "required": true },
            "result_orientation": { "dataType": "double", "required": true },
            "result_pixscale": { "dataType": "double", "required": true },
            "result_radius": { "dataType": "double", "required": true },
            "result_ra": { "dataType": "double", "required": true },
            "result_dec": { "dataType": "double", "required": true },
            "id": { "dataType": "double", "required": true },
            "created": { "dataType": "double", "required": true },
            "processing_state": { "dataType": "double", "required": true },
            "processing_finished": { "dataType": "double", "required": true },
            "processing_started": { "dataType": "double", "required": true },
            "worker_id": { "dataType": "string", "required": true },
            "filename": { "dataType": "string", "required": true },
            "original_filename": { "dataType": "string", "required": true },
            "url": { "dataType": "string", "required": true },
            "error_id": { "dataType": "string", "required": true },
            "error_text": { "dataType": "string", "required": true },
            "p_scale_units": { "dataType": "string", "required": true },
            "p_scale_type": { "dataType": "string", "required": true },
            "p_scale_lower": { "dataType": "double", "required": true },
            "p_scale_upper": { "dataType": "double", "required": true },
            "p_scale_est": { "dataType": "double", "required": true },
            "p_scale_err": { "dataType": "double", "required": true },
            "p_center_ra": { "dataType": "double", "required": true },
            "p_center_dec": { "dataType": "double", "required": true },
            "p_radius": { "dataType": "double", "required": true },
            "p_downsample_factor": { "dataType": "double", "required": true },
            "p_tweak_order": { "dataType": "double", "required": true },
            "p_crpix_center": { "dataType": "double", "required": true },
            "p_parity": { "dataType": "double", "required": true },
            "p_positional_error": { "dataType": "double", "required": true },
            "cancel_requested": { "dataType": "double", "required": true },
            "img_objs_thumb": { "dataType": "string", "required": true },
            "img_ngc_thumb": { "dataType": "string", "required": true },
        },
    },
    "WorkerState": {
        "properties": {
            "pid": { "dataType": "double", "required": true },
            "cpu": { "dataType": "double", "required": true },
        },
    },
    "WorkerSystemState": {
        "properties": {
            "workerManagerRunning": { "dataType": "boolean", "required": true },
            "activeWorkers": { "dataType": "array", "array": { "ref": "WorkerState" }, "required": true },
        },
    },
    "EditableConfig": {
        "properties": {
            "sigma": { "dataType": "double", "required": true, "validators": { "minimum": { "value": 0 } } },
            "depth": { "dataType": "double", "required": true, "validators": { "minimum": { "value": 0 } } },
            "saveObjImages": { "dataType": "boolean", "required": true },
            "saveNgcImages": { "dataType": "boolean", "required": true },
            "imageScale": { "dataType": "double", "required": true, "validators": { "minimum": { "value": 0.1 } } },
        },
    },
};

export function RegisterRoutes(app: any) {
    app.post('/api/login',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                req: { "in": "body", "name": "req", "required": true, "ref": "LoginRequestWrapper" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new LoginController();
            const promise = controller.postLogin.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/upload',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                model: { "in": "body", "name": "model", "required": true, "ref": "UploadRequestWrapper" },
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new UploadController();
            const promise = controller.postUpload.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/url_upload',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                model: { "in": "body", "name": "model", "required": true, "ref": "UrlUploadRequestWrapper" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new UrlUploadController();
            const promise = controller.postUploadUrl.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/submissions/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "integer", "validators": { "isInt": { "errorMsg": "id" } } },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new SubmissionsController();
            const promise = controller.get.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/submissions/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "integer", "validators": { "isInt": { "errorMsg": "id" } } },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new SubmissionsController();
            const promise = controller.post.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/jobs/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "integer", "validators": { "isInt": { "errorMsg": "id" } } },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getJob.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/jobs/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getJobPost.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/jobs/:id/calibration',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getCalibration.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/jobs/:id/calibration',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getCalibrationPost.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/jobs/:id/info',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getInfo.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/jobs/:id/info',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobsController();
            const promise = controller.getInfoPost.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/stats/supports',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new StatsController();
            const promise = controller.getSupportData.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/stats/latest',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new StatsController();
            const promise = controller.getLatestJobs.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/stats/workers',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new StatsController();
            const promise = controller.getWorkerStates.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/result-images/annotation/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ResultImageController();
            const promise = controller.getAnnotationImage.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/result-images/objects/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "double" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ResultImageController();
            const promise = controller.getObjectImage.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/job-control/cancel/:id',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "integer", "validators": { "isInt": { "errorMsg": "id" } } },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new JobControlController();
            const promise = controller.killJob.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.post('/api/config',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                conf: { "in": "body", "name": "conf", "required": true, "ref": "EditableConfig" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ConfigEditController();
            const promise = controller.setConfig.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );
    app.get('/api/config',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ConfigEditController();
            const promise = controller.getConfig.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        })
    );


    function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode;
                if (controllerObj instanceof Controller) {
                    const controller = controllerObj as Controller
                    const headers = controller.getHeaders();
                    Object.keys(headers).forEach((name: string) => {
                        response.set(name, headers[name]);
                    });

                    statusCode = controller.getStatus();
                }

                if (data) {
                    response.status(statusCode || 200).json(data);
                } else {
                    response.status(statusCode || 204).end();
                }
            })
            .catch((error: any) => next(error));
    }

    function getValidatedArgs(args: any, request: any): any[] {
        const fieldErrors: FieldErrors = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return ValidateParam(args[key], request.query[name], models, name, fieldErrors);
                case 'path':
                    return ValidateParam(args[key], request.params[name], models, name, fieldErrors);
                case 'header':
                    return ValidateParam(args[key], request.header(name), models, name, fieldErrors);
                case 'body':
                    return ValidateParam(args[key], request.body, models, name, fieldErrors, name + '.');
                case 'body-prop':
                    return ValidateParam(args[key], request.body[name], models, name, fieldErrors, 'body.');
            }
        });
        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }
}