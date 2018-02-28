/* tslint:disable */

import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';

import { LoginController } from './../../controllers/login';
import { UploadController } from './../../controllers/upload';
import { UrlUploadController } from './../../controllers/url-upload';
import { SubmissionsController } from './../../controllers/submissions';
import { JobsController } from './../../controllers/jobs';

import { asyncErrorHandler } from '../../middleware/error-handler';


const models: TsoaRoute.Models = {
    "LoginResponse": {
        "properties": {
            "status": { "dataType": "string", "required": true },
            "message": { "dataType": "string", "required": true },
            "session": { "dataType": "string", "required": true },
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
            "downsample_factor": { "dataType": "double", "validators": { "minimum": { "value": 2 } } },
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
            "downsample_factor": { "dataType": "double", "validators": { "minimum": { "value": 2 } } },
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
};

export function RegisterRoutes(app: any) {
    app.post('/api/login',
        asyncErrorHandler(async (request: any, response: any, next: any) => {
            const args = {
                req: { "in": "body", "name": "req", "required": true, "dataType": "any" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new LoginController();
            const promise = controller.post.apply(controller, validatedArgs);
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
            const promise = controller.post.apply(controller, validatedArgs);
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
            const promise = controller.post.apply(controller, validatedArgs);
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
            const promise = controller.get.apply(controller, validatedArgs);
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