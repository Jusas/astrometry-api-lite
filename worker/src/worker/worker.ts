import * as sqlite from "sqlite";
import * as cfg from "../configuration"
import * as shelljs from "shelljs";
import * as readline from "readline";
//import * as cproc from "child_process";
import { spawn } from "./asyncprocess";
import * as fs from "fs";
import * as bl from "bl";
import { JobQueueEntry } from "../common/models/job";

//const spawn = require("await-spawn");
const datetime = require("node-datetime");

// TODO TODO TODO failed processings, mark processing_state properly.
export async function processQueueItem() {

	console.log("Checking for a work item...")
	const dbFile = cfg.parseAsPath(cfg.get("worker").database);
	const myId = cfg.get("worker-id");	

	let db = await sqlite.open(dbFile);

	//let query = "select * from JobQueue where processing_state = 0 order by created";
	let query = "select * from JobQueue";
	let result = await db.get(query);
	let job_id = 0;
	if(result) {

		job_id = result.id;
		console.log(`Found a work item (id ${job_id}), attempting to checkout`)
		
		let update = `update JobQueue set processing_state = 1, worker_id = ? where id = ${result.id}`;
		let stmt = await db.prepare(update);
		await stmt.run(myId);

		query = `select * from JobQueue where id = ${job_id} and worker_id = ?`;
		stmt = await db.prepare(query);
		let queueItem = <JobQueueEntry> await stmt.get(myId);
		if(queueItem) {
			console.log("Work item checked out, beginning processing");
			// start work.

			let tempDir = cfg.parseAsPath(cfg.get("worker").tempDir);
			if(!tempDir) {
				tempDir = "/tmp";
			}

			const outDir = `${tempDir}/${queueItem.id}`;
			if(!fs.existsSync(outDir)) {
				shelljs.mkdir("-p", outDir);
			}
			const params = buildSolveParams(queueItem, outDir);
			
			await spawn("solve-field", params).catch( (err) => { 
				console.error("Solve-field failed"); // TODO better error logging and reporting
				throw err;
			});

			if(fs.existsSync(`${outDir}/wcs`) && fs.existsSync(`${outDir}/solved`)) {

				console.log("Solve-field solver run completed successfully");

				const wcsTableFile = `${outDir}/wcs-table`;
				let wcsStream = fs.createWriteStream(wcsTableFile, {flags: "w"});
				await spawn(`wcsinfo`, [`${outDir}/wcs`], wcsStream).catch( (err) => {
					console.error("Failed to run wcsinfo on results!");
					wcsStream.close();
					throw err;
				});
				wcsStream.close();
				const wcsTable = fs.readFileSync(wcsTableFile).toString();								
				const solverResult = wcsTableToJson(wcsTable);

				console.log("WCS list parsed");
			
				let update = `update JobQueue set processing_state = 2, processing_finished = ?, result_parity = ?,
					result_orientation = ?, result_pixscale = ?, result_radius = ?, result_ra = ?, result_dec = ?
					where id = ${job_id}`;
				let updateData = [
					datetime.create().now()
				];

				updateData.push(solverResult.parity ? solverResult.parity : null);
				updateData.push(solverResult.orientation ? solverResult.orientation : null);
				updateData.push(solverResult.pixscale ? solverResult.pixscale : null);
				if(solverResult.imagew && solverResult.imageh && solverResult.pixscale) {
					updateData.push(calcRadius(solverResult.imagew, solverResult.imageh, solverResult.pixscale));
				}
				else {
					updateData.push(null);
				}
				updateData.push(solverResult.ra_center ? solverResult.ra_center : null);
				updateData.push(solverResult.dec_center ? solverResult.dec_center : null);

				console.log("Updating job with results");
				stmt = await db.prepare(update);
				stmt.run(updateData).catch( (err) => { 
					console.error("Failed to update job status");
					throw err;
				});
				// TODO the update failed, the job will remain in queue to be retried - should probably eliminate the possibility of infinite failure.

				console.log("Job state and results updated successfully");


			}
			else {
				console.error("Solve-field run ended and no valid results exist!");
			}


		}

	}
	else {
		console.log("No unprocessed work items found");
	}
}

function buildSolveParams(queueEntry: JobQueueEntry, outDir: string): Array<string> {
	
	let timeLimit = cfg.get("worker").cpuTimeLimit;
	let uploadDir = cfg.get("worker").queueFileUploadDir;
	let params = [];
	
	if(!timeLimit) {
		timeLimit = 200;
	}
	if(!uploadDir) {
		throw Error("file upload directory not defined");
	}

	params.push(...["-p"]);
	params.push(...["-R", "none"]);
	params.push(...["-M", "none"]);
	params.push(...["-B", "none"]);
	params.push(...["-U", "none"]);
	params.push(...["-N", "none"]);
	params.push(...["--temp-axy"]);
	params.push(...["--wcs", `${outDir}/wcs`]);
	params.push(...["-S", `${outDir}/solved`]);
	params.push(...["-l", `${timeLimit}`]);

	if(queueEntry.p_scale_units) {
		params.push(...["--scale-units", queueEntry.p_scale_units]);			
	}
	if(queueEntry.p_scale_type) {
		if(queueEntry.p_scale_type == "ev" && queueEntry.p_scale_est && queueEntry.p_scale_err) {
			params.push(...["--scale-est", queueEntry.p_scale_est]);
			params.push(...["--scale-err", queueEntry.p_scale_err]);
		}
		if(queueEntry.p_scale_type == "ul" && queueEntry.p_scale_upper && queueEntry.p_scale_lower) {
			params.push(...["--scale-high", queueEntry.p_scale_upper]);
			params.push(...["--scale-low", queueEntry.p_scale_lower]);
		}					
	}
	if(queueEntry.p_center_ra && queueEntry.p_center_dec && queueEntry.p_radius) {
		params.push(...["--ra", queueEntry.p_center_ra]);
		params.push(...["--dec", queueEntry.p_center_dec]);
		params.push(...["--radius", queueEntry.p_radius]);
	}
	if(queueEntry.p_downsample_factor) {
		params.push(...["--downsample", queueEntry.p_downsample_factor]);
	}
	if(queueEntry.p_tweak_order) {
		params.push(...["--tweak-order", queueEntry.p_tweak_order]);
	}
	if(queueEntry.p_crpix_center) {
		params.push(...["--crpix-center", queueEntry.p_crpix_center]);
	}
	if(queueEntry.p_parity && queueEntry.p_parity <= 1) {
		params.push(...["--parity", queueEntry.p_parity == 0 ? "pos" : "neg"]);
	}
	if(queueEntry.p_positional_error) {
		params.push(...["--pixel-error", queueEntry.p_positional_error]);
	}
	
	params.push(`${uploadDir}/${queueEntry.filename}`);

	return params;
}

function wcsTableToJson(buf: string): any {
	let json = {};
	let lines = buf.split("\n");
	lines.map( (line) => {
		let keyValue = line.split(/\s+/);
		if(keyValue.length == 2) {
			json[keyValue[0]] = keyValue[1];
		}
	});
	console.log("json is now: " + JSON.stringify(json));
	return json;
}

function calcRadius(imagew: number, imageh: number, pixscale: number) {
	return Math.sqrt((imagew * imagew) + (imageh * imageh)) * pixscale / 2 / 3600;
}