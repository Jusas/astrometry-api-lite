import * as sqlite from "sqlite";
import * as fs from "fs";
import * as config from "../configuration";

// Check queue status, spawn 1-n child processes to solve.
// So we have a manager and workers.
// Workers can be spawned to handle one item or to be on continuously, polling.
// Worker and manager use the same poller code.
export async function getRecommendedWorkerCount() {
	
	const cfg = config.get("manager");
	let dbFile = cfg.database;
	let db = await sqlite.open(dbFile);

	let query = "select count(*) as count from JobQueue where processing_state = 0";
	let result = await db.get(query);
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