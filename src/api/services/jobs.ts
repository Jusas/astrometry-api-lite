import * as sqlite from "sqlite";
import { CreatedJobEntry, JobStatus } from "../models/job";
import { JobCalibrationResultData, JobQueueEntry, JobFileInfo, JobParams, JobQueueEntryWithThumbs, ResultImageType } from "../../common/models/job";
import { configuration } from "../../common/configuration";
import { SqliteJobQueue } from "../../common/sqlite-jobqueue";
import { ApiError } from "../models/error";
var crypto = require("crypto");
var datetime = require("node-datetime");
const fs = require('fs');

export async function queue(fileInfo: JobFileInfo, parameters: JobParams): Promise<CreatedJobEntry> {

	const started = datetime.create().now();
	const finished = started;
	const dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);

	const itemId = await q.createWorkItem(parameters, fileInfo, 10);
	await q.release();
	if(itemId == -1) {
		throw new ApiError("Could not create a new work item into queue", 500);
	}

	const res: CreatedJobEntry = {
		id: itemId,
		hash: null
	};
	return res;
}

export async function getStatus(id: number): Promise<JobStatus> {

	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
		
	const item = await q.getWorkItem(id, 10);
	await q.release();
	if(!item) {
		throw new ApiError("Work item not found", 404);
	}
	
	var result: JobStatus = {
		id: id,
		processing_started: item.processing_started || null,
		processing_finished: item.processing_finished || null,
		processing_state: item.processing_state
	}

	return result;
}

export async function getCalibrationData(id: number): Promise<JobCalibrationResultData> {
	
	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
	
	const item = await q.getWorkItem(id, 10);
	await q.release();
	if(!item) {
		throw new ApiError("Work item not found", 404);
	}

	return {
		result_dec: item.result_dec,
		result_orientation: item.result_orientation,
		result_parity: item.result_parity,
		result_pixscale: item.result_pixscale,
		result_ra: item.result_ra,
		result_radius: item.result_radius
	};

}

export async function getFullData(id: number): Promise<JobQueueEntry> {
	
	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
	
	const item = await q.getWorkItem(id, 10);
	await q.release();

	if(!item) {
		throw new ApiError("Work item not found", 404);
	}

	return item;
	
}

export async function getLatestJobs(count: number): Promise<JobQueueEntryWithThumbs[]> {
		
	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
	
	const items = await q.getLatestWorkItems(count, 10);
	await q.release();

	return items;
}

export async function getResultImage(id: number, imgType: ResultImageType): Promise<string> {
	
	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
	
	const img = await q.getWorkItemResultImage(id, imgType, 10);
	await q.release();

	return img;
}

export async function tryCancelJob(id: number): Promise<boolean> {

	let dbFile = configuration().database;
	const q = new SqliteJobQueue(dbFile);
	
	const item = await q.getWorkItem(id, 10);
	if(item) {
		let didCancel = false;
		try {
			if(item.processing_state == 0) {
				await q.trySetWorkItemFailed(id, "canceled by request", 10);
				didCancel = true;
			}
			else if(item.processing_state == 1) {
				await q.trySetWorkItemCanceled(id, 10);
				didCancel = true;
			}
		}
		catch(err) {
			didCancel = false;
		}
		finally {
			q.release();
		}
		
		return didCancel;
	}

	return false;
}
