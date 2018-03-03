import * as sqlite from "sqlite";
import { configuration } from "../common/configuration"
import * as shelljs from "shelljs";
import * as readline from "readline";
import { spawn } from "../common/asyncprocess";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import * as bl from "bl";
import { JobQueueEntry, JobCalibrationResultData } from "../common/models/job";
import { JobProcessingError } from "../common/models/error";
import { SqliteJobQueue } from "../common/sqlite-jobqueue";

const datetime = require("node-datetime");

export async function processQueueItem() {

	console.log("Checking for a work item...")
	const config = configuration();
	const dbFile = config.database;
	const myId = config["worker-id"];

	const q = new SqliteJobQueue(dbFile);

	const workItem = await q.reserveWorkItem(myId, -1);
	if(!workItem) {
		console.log("Nothing to process");
		return;
	}

	await q.release();

	const job_id = workItem.id;

	console.log("Checked out work item " + job_id);

	try
	{
		let tempDir = resolveTempDir();

		const outDir = `${tempDir}/${job_id}`;
		if(!fs.existsSync(outDir)) {
			shelljs.mkdir("-p", outDir);
		}
		const params = buildSolveParams(workItem, outDir);
		
		await spawn("solve-field", params).catch( (err) => { 					
			console.error("Solve-field failed");
			throw err;
		});

		if(fs.existsSync(`${outDir}/wcs`) && fs.existsSync(`${outDir}/solved`)) {

			console.log("Solve-field solver run completed successfully");

			const wcsTableFile = `${outDir}/wcs-table`;
			let wcsStream = fs.createWriteStream(wcsTableFile, {flags: "w"});
			const streamPromise = new Promise<void>((resolve, reject) => {
				wcsStream.on("close", () => resolve());
			});
			await spawn(`wcsinfo`, [`${outDir}/wcs`], wcsStream).catch( (err) => {
				console.error("Failed to run wcsinfo on results!");
				wcsStream.close();
				throw err;
			});			
			wcsStream.close();
			await streamPromise;
			const wcsTable = fs.readFileSync(wcsTableFile).toString();								
			const solverResult = wcsTableToJson(wcsTable);

			console.log("WCS list parsed");

			const updateData: JobCalibrationResultData = {
				result_dec: solverResult.dec_center ? solverResult.dec_center : null,
				result_orientation: solverResult.orientation ? solverResult.orientation : null,
				result_parity: solverResult.parity ? solverResult.parity : null,
				result_pixscale: solverResult.pixscale ? solverResult.pixscale : null,
				result_ra: solverResult.ra_center ? solverResult.ra_center : null,
				result_radius: solverResult.imagew && solverResult.imageh && solverResult.pixscale
					? calcRadius(solverResult.imagew, solverResult.imageh, solverResult.pixscale)
					: null
			};

			console.log("Updating job with results");
			await q.saveWorkItemResult(job_id, updateData, 10);
			console.log("Job state and results updated successfully");
		}
		else {
			console.error("Solve-field run ended and no valid results exist!");
			throw new JobProcessingError("could not find result files", []);
		}
	}
	catch(err) {
		try {
			await q.trySetWorkItemFailed(job_id, JSON.stringify(err), 10);
			console.log("Job marked as failure, error information updated");
		}
		catch(err) {
			console.error("Error, couldn't even set the job status as failure :(");
		}				
	}
	finally {
		cleanUpTemp(job_id);
		await q.release();
	}


}

function buildSolveParams(queueEntry: JobQueueEntry, outDir: string): Array<string> {
	
	const config = configuration();
	let timeLimit = config.computationTimeLimit;
	let uploadDir = config.queueFileUploadDir;
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
	let tempDir = configuration().tempDir;
	if(!tempDir) {
		tempDir = "/tmp";
	}
	return tempDir;
}