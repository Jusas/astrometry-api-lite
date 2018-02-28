import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import * as datetime from "node-datetime";
import { SubmissionInfoResponse } from "../models/submission";
import * as Jobs from "../services/jobs";
import { ProcessingState } from "../models/job";
import { ApiError } from "../models/error";


@Route("api/submissions")
export class SubmissionsController {

	/**
	 * @isInt id
	 */
  @Get("{id}")
  async get (id: number): Promise<SubmissionInfoResponse> {
    const status = await Jobs.getStatus(id);
    if(!status) {
      throw new ApiError("submission not found", 404);
    }
    let started = <any>status.processing_started;
    let finished = <any>status.processing_finished;
    started = started ? datetime.create(started).format("Y-m-d H:M:S.NZ") : "None";
    finished = finished ? datetime.create(finished).format("Y-m-d H:M:S.NZ") : "None";

    let jobs = [null];
    let job_calibrations = [];

    if(status.processing_state != ProcessingState.Queued) {
      jobs = [id];
    }

    if(status.processing_state == ProcessingState.Succeeded 
      || status.processing_state == ProcessingState.Failed) {
      job_calibrations = [id];
    }

    const result: SubmissionInfoResponse = {
      jobs: jobs,
      job_calibrations: job_calibrations,
      processing_started: started,
      processing_finished: finished,
      user: 0,
      user_images: []
    }
    return result;
  }

}
