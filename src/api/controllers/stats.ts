import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import * as datetime from "node-datetime";
import { SubmissionInfoResponse } from "../models/submission";
import * as Jobs from "../services/jobs";
import { ProcessingState } from "../models/job";
import { ApiError } from "../models/error";
import { JobQueueEntry, JobQueueEntryWithThumbs } from "../../common/models/job";
import { WorkerState, WorkerSystemState } from "../models/workerstates";
import { configuration } from "../../common/configuration";
import { ApiSupports } from "../models/supports";
const psList = require("ps-list");

let lastStatusRequest = 0;
let cachedWorkerSystemState: WorkerSystemState = {
  activeWorkers: [],
  workerManagerRunning: false
};

@Route("api/stats")
export class StatsController {

  @Get("supports")
  async getSupportData(): Promise<ApiSupports> {
    let supports: ApiSupports = {
      jobCancellationSupported: false
    };
    const config = configuration();
    console.log("config", config);
    if (config["enableJobCancellationApi"]) {
      supports.jobCancellationSupported = true;
    }
    return supports;
  }

  @Get("latest")
  async getLatestJobs(): Promise<JobQueueEntryWithThumbs[]> {
    const latestJobs = await Jobs.getLatestJobs(20);
    return latestJobs;
  }

  @Get("workers")
  async getWorkerStates(): Promise<WorkerSystemState> {

    const now = datetime.create().now();
    if (now - lastStatusRequest <= 2000) {
      return cachedWorkerSystemState;
    }

    const processes = await psList();
    const workerRegex = /dist\/worker\/main\.js/;
    const managerRegex = /dist\/manager\/main\.js/;

    const workers = processes.filter((proc) => proc.name == "node" && workerRegex.test(proc.cmd));
    const managers = processes.filter((proc) => proc.name == "node" && managerRegex.test(proc.cmd));
    const results = workers.map((proc) => {
      return {
        pid: proc.pid,
        cpu: proc.cpu
      }
    });
    cachedWorkerSystemState = {
      activeWorkers: results,
      workerManagerRunning: managers.length > 0
    };
    lastStatusRequest = datetime.create().now();
    return cachedWorkerSystemState;
  }

}
