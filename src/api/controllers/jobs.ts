import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import * as datetime from "node-datetime";
import { JobStatusResponse, JobStatusResponseStatus, JobCalibrationResponse, JobInfoResponse } from "../models/job";
import * as Jobs from "../services/jobs";
import { ProcessingState } from "../models/job";
import { ApiError } from "../models/error";


@Route("api/jobs")
export class JobsController {

	/**
	 * @isInt id
	 */
  @Get("{id}")
  async getJob (id: number): Promise<JobStatusResponse> {
    const status = await Jobs.getStatus(id);
		if(!status) {
			throw new ApiError("Job not found", 404)
		}
		let state = JobStatusResponseStatus.none;
		switch(status.processing_state) {
			case ProcessingState.Queued:
				state = JobStatusResponseStatus.none;
				break;
			case ProcessingState.Processing:
				state = JobStatusResponseStatus.solving;
				break;
			case ProcessingState.Succeeded:
				state = JobStatusResponseStatus.success;
				break;
			case ProcessingState.Failed:
				state = JobStatusResponseStatus.failure;
				break;
		}
		
    const result: JobStatusResponse = {
      status: state
    }
    return result;
	}
	
	@Get("{id}/calibration")
	async getCalibration (id: number): Promise<JobCalibrationResponse> {
		const cd = await Jobs.getCalibrationData(id);
		if(!cd) {
			throw new ApiError("calibration data not found", 404);
		}
		if(cd.result_dec == null || cd.result_orientation == null || cd.result_parity == null
			|| cd.result_pixscale == null || cd.result_ra == null || cd.result_radius == null) {
			throw new ApiError("calibration data not yet received", 404);
		}
		const result: JobCalibrationResponse = {
			orientation: cd.result_orientation,
			dec: cd.result_dec,
			parity: cd.result_parity,
			pixscale: cd.result_pixscale,
			ra: cd.result_ra,
			radius: cd.result_radius
		};
		return result;
	}

	@Get("{id}/info")
	async getInfo (id: number): Promise<JobInfoResponse> {
		const data = await Jobs.getFullData(id);
		if(!data) {
			throw new ApiError("job not found", 404);
		}

		let status = data.processing_state == 0 ? JobStatusResponseStatus.none 
			: data.processing_state == 1 ? JobStatusResponseStatus.solving 
			: data.processing_state == 2 ? JobStatusResponseStatus.success
			: data.processing_state == 3 ? JobStatusResponseStatus.failure
			: JobStatusResponseStatus.none;


		const result: JobInfoResponse = {
			machine_tags: [],
			tags: [],
			objects_in_field: [],
			calibration: {
				dec: data.result_dec,
				orientation: data.result_orientation,
				parity: data.result_parity,
				pixscale: data.result_pixscale,
				ra: data.result_ra,
				radius: data.result_radius
			},
			original_filename: data.original_filename,
			status: status
		};
		return result;
	}

}
