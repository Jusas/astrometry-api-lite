import * as sqlite from "sqlite";
import * as cfg from "../configuration"
import * as shelljs from "shelljs";
import * as readline from "readline";
import { spawn } from "../common/asyncprocess";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import * as bl from "bl";
import { JobQueueEntry } from "../common/models/job";
import { JobProcessingError } from "../common/models/error";

const datetime = require("node-datetime");

export async function processQueueItem() {

	console.log("Checking for a work item...")
	const dbFile = cfg.parseAsPath(cfg.get("worker").database);
	const myId = cfg.get("worker-id");	

	let db = await sqlite.open(dbFile);
	let query = "select * from JobQueue where processing_state = 0 order by created";
	let result = await db.get(query);
	await db.close();

	let job_id = 0;
	if(result) {

		job_id = result.id;
		console.log(`Found a work item (id ${job_id}), attempting to checkout`)

		let db = await sqlite.open(dbFile);
		await db.run("PRAGMA journal_mode = WAL;");

		let update = `update JobQueue set processing_state = 1, worker_id = ? where id = ${result.id}`;
		let stmt = await db.prepare(update);
		await stmt.run(myId);
		await stmt.finalize();
		//await db.close();

		//db = await sqlite.open(dbFile);
		query = `select * from JobQueue where id = ${job_id} and worker_id = ?`;
		stmt = await db.prepare(query);
		let queueItem = <JobQueueEntry> await stmt.get(myId);
		await stmt.finalize();
		//await db.close();

		if(queueItem) {
			console.log("Work item checked out, beginning processing");
			
			try
			{
				let tempDir = resolveTempDir();

				const outDir = `${tempDir}/${queueItem.id}`;
				if(!fs.existsSync(outDir)) {
					shelljs.mkdir("-p", outDir);
				}
				const params = buildSolveParams(queueItem, outDir);
				
				await spawn("solve-field", params).catch( (err) => { 					
					console.error("Solve-field failed");
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
					//db = await sqlite.open(dbFile);
					stmt = await db.prepare(update);
					// TODO all promise rejections
					await stmt.run(updateData).catch( (err) => { 
						console.error("Failed to update job status");
						throw err;
					});
					await stmt.finalize();
					//await db.close();

					console.log("Job state and results updated successfully");
				}
				else {
					console.error("Solve-field run ended and no valid results exist!");
					throw new JobProcessingError("could not find result files", []);
				}
			}
			catch(err) {
				//db = await sqlite.open(dbFile);
				let update = `update JobQueue set processing_state = 3, error_text = ? where id = ${job_id}`;
				let stmt = await db.prepare(update);
				await stmt.run(JSON.stringify(err));
				await stmt.finalize();
				//await db.close();
				console.log("Job marked as failure, error information updated");
			}
			finally {
				await db.close();
				cleanUpTemp(job_id);
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
		throw new JobProcessingError("file upload directory not defined in configuration, unable to find work files", []);
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
	console.log("WCS table has " + lines.length + " lines");
	if(lines.length == 0) {
		console.log("WARNING! WCS table does not have newlines!");
		console.log(buf);
	}
	lines.map( (line) => {
		let keyValue = line.split(/\s+/);
		if(keyValue.length == 2) {
			json[keyValue[0]] = keyValue[1];
			console.log("VAL: " + keyValue[0] + " = " + keyValue[1]);
		}
		else {
			console.log("WARNING: arr len is not 2:");
			console.log(line);
			fs.writeFileSync("/tmp/error." + Math.random(), buf);
		}
	});
	console.log("json is now: " + JSON.stringify(json));
	return json;
}

function calcRadius(imagew: number, imageh: number, pixscale: number): number {
	return Math.sqrt((imagew * imagew) + (imageh * imageh)) * pixscale / 2 / 3600;
}

function cleanUpTemp(id: number) {
	let workDir = path.join(resolveTempDir(), `${id}`);
	if(fs.existsSync(workDir)) {
		console.log("Cleaning up " + workDir);
		rimraf.sync(workDir, {disableGlob: true})
	}
}

function resolveTempDir(): string {
	let tempDir = cfg.parseAsPath(cfg.get("worker").tempDir);
	if(!tempDir) {
		tempDir = "/tmp";
	}
	return tempDir;
}