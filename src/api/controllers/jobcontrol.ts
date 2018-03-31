import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import * as datetime from "node-datetime";
import { JobStatusResponse, JobStatusResponseStatus, JobCalibrationResponse, JobInfoResponse } from "../models/job";
import * as Jobs from "../services/jobs";
import { ProcessingState } from "../models/job";
import { ApiError } from "../models/error";


@Route("api/job-control")
export class JobControlController {

	/**
	 * @isInt id
	 */
  @Get("cancel/{id}")
  async killJob (id: number): Promise<boolean> {
    const status = await Jobs.tryCancelJob(id);
    return status;
	}

}