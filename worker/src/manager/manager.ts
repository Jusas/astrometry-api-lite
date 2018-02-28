import * as sqlite from "sqlite";
import * as fs from "fs";
import * as uuid from "uuid";
import { spawn } from "../common/asyncprocess";
import { RunningProcess } from "../common/models/runningProcess"
import * as config from "../configuration";

// Check queue status, spawn 1-n child processes to solve.
// So we have a manager and workers.
// Workers can be spawned to handle one item or to be on continuously, polling.
// Worker and manager use the same poller code.
export async function getRecommendedWorkerCount(): Promise<number> {
	
	const cfg = config.get("manager");
	let dbFile = cfg.database;
	let db = await sqlite.open(dbFile);
	await db.run("PRAGMA journal_mode = WAL;");

	let query = "select count(*) as count from JobQueue where processing_state <= 1";
	let result = await db.get(query);
	db.close();

	if(!result) {
		console.error("Failed to retrieve job queue count");
		return;
	}

	if(result.count == 0) {
		return;
	}

	let count = result.count > cfg.maxConcurrentWorkers ? cfg.maxConcurrentWorkers : result.count;
	return count;

}

export function spawnWorkerInstance(): RunningProcess {

	let worker = config.get("manager").worker;
	let workerConfig = config.get("manager").workerConfig;
	let id = uuid.v4();
	let workerPromise = spawn("node", [worker, "-c", workerConfig])
		.catch( (err) => { 
			console.error("Worker process returned an error");
			throw err;
		});
	return {
		promise: workerPromise,
		id: id
	};
}