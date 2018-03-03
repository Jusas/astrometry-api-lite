import * as sqlite from "sqlite";
import * as fs from "fs";
import * as uuid from "uuid";
import { spawn } from "../common/asyncprocess";
import { SqliteJobQueue } from "../common/sqlite-jobqueue";
import { RunningProcess } from "../common/models/runningProcess"
import { configuration } from "../common/configuration";

// Check queue status, spawn 1-n child processes to solve.
// So we have a manager and workers.
// Workers can be spawned to handle one item or to be on continuously, polling.
// Worker and manager use the same poller code.
export async function getRecommendedWorkerCount(): Promise<number> {
	
	const config = configuration();
	let dbFile = config.database;

	const q = new SqliteJobQueue(dbFile);
	
	let count = await q.countUnprocessedAndProcessing(-1);
	await q.release();
	
	if(count == 0) {
		return 0;
	}

	count = count > config.maxConcurrentWorkers ? config.maxConcurrentWorkers : count;
	return count;
}

export function spawnWorkerInstance(): RunningProcess {

	const config = configuration();
	let worker = config.worker;
	let id = uuid.v4();
	let workerPromise = spawn("node", [worker, "-i", id])
		.catch( (err) => { 
			console.error("Worker process returned an error");
			throw err;
		});
	return {
		promise: workerPromise,
		id: id
	};
}