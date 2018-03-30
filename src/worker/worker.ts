import * as sqlite from "sqlite";
import { configuration } from "../common/configuration"
import * as shelljs from "shelljs";
import * as readline from "readline";
import { spawn } from "../common/asyncprocess";
import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import * as bl from "bl";
import * as jimp from "jimp";
import { JobQueueEntry, JobCalibrationResultData, JobCalibrationResultWithOutputImages } from "../common/models/job";
import { JobProcessingError } from "../common/models/error";
import { SqliteJobQueue } from "../common/sqlite-jobqueue";

const datetime = require("node-datetime");

export async function processQueueItem() {

	console.log("Checking for a work item...")
	const config = configuration();
	const dbFile = config.database;
	const myId = config["worker-id"];
	const saveObjImg = config["storeObjsImages"];
	const saveNgcImg = config["storeNgcImages"];
	const imgScaling = config["imageScale"];

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
		// All jobs older than 15 minutes will be abandoned.
		const expirationMs = config["skipJobsOlderThanSeconds"] * 1000;
		const now = datetime.create().now();
		if(now - workItem.created > expirationMs) {
			console.log(`Work item is older than ${expirationMs/1000/60} minutes, skipping and marking as failure.`);
			await q.trySetWorkItemFailed(job_id, "job expired", 10);
			return;
		}

		let tempDir = resolveTempDir();

		const outDir = `${tempDir}/${job_id}`;
		if(!fs.existsSync(outDir)) {
			shelljs.mkdir("-p", outDir);
		}

		if(workItem.url) {
			const tempFilename = await fetch(workItem.url, outDir);
			workItem.filename = tempFilename;
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

			let objImage = "";
			let ngcImage = "";

			if(saveObjImg) {
				try {
					console.log("Processing output object image...")
					const f = `${workItem.id}-objs.png`;
					objImage = await resizeAndConvertToBase64(`${outDir}/${f}`, imgScaling);
					console.log("Done, object image length: " + objImage.length);
				}
				catch(err) {
					console.log("Failed to convert/resize object image", err);
				}
			}
			if(saveNgcImg) {
				try {
					console.log("Processing output NGC image...")
					const f = `${workItem.id}-ngc.png`;
					ngcImage = await resizeAndConvertToBase64(`${outDir}/${f}`, imgScaling);
					console.log("Done, NGC image length: " + ngcImage.length);
				}
				catch(err) {
					console.log("Failed to convert/resize NGC image", err);
				}
			}

			const updateData: JobCalibrationResultWithOutputImages = {
				result_dec: solverResult.dec_center ? solverResult.dec_center : null,
				result_orientation: solverResult.orientation ? solverResult.orientation : null,
				result_parity: solverResult.parity ? solverResult.parity : null,
				result_pixscale: solverResult.pixscale ? solverResult.pixscale : null,
				result_ra: solverResult.ra_center ? solverResult.ra_center : null,
				result_radius: solverResult.imagew && solverResult.imageh && solverResult.pixscale
					? calcRadius(solverResult.imagew, solverResult.imageh, solverResult.pixscale)
					: null,
				img_ngc: ngcImage,
				img_objs: objImage
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
		cleanUpTemp(workItem);
		await q.release();
	}


}

async function fetch(url: string, outDir: string): Promise<string> {
	const file = path.join(outDir, "web-file");
	await spawn("curl", ["-o", file, url]).catch( (err) => {
		console.error(`Failed to get url '${url}'`);
		throw err;
	});
	return file;
}

async function resizeAndConvertToBase64(filePath: string, scale: number): Promise<string> {
	const p = new Promise<string>( (resolve, reject) => {
		jimp.read(filePath, (err, img) => {
			if(err) {
				reject(err);
			}
			else {
				img.scale(scale, jimp.RESIZE_BILINEAR)
					.quality(65)
					.getBase64("image/jpeg", (err, data) => {
						if(err) {
							reject(err);
						}
						else {
							resolve(data);
						}
					});
			}
		});

	});
	return await p;
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

	params.push(...["-D", `${outDir}`]);
	params.push(...["-o", `${queueEntry.id}`]);
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
	
	if(queueEntry.url) {
		params.push(queueEntry.filename);
	}
	else {
		params.push(`${uploadDir}/${queueEntry.filename}`);
	}

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

function cleanUpTemp(workItem: JobQueueEntry) {
	let workDir = path.join(resolveTempDir(), `${workItem.id}`);
	let uploadDir = resolveTempUploadDir();
	if(fs.existsSync(workDir)) {
		console.log("Cleaning up " + workDir);
		rimraf.sync(workDir, {disableGlob: true})
	}
	let uploadImage = path.join(uploadDir, workItem.filename);
	if(fs.existsSync(uploadImage)) {
		fs.unlinkSync(uploadImage);
	}
}

function resolveTempDir(): string {
	let tempDir = configuration().tempDir;
	if(!tempDir) {
		tempDir = "/tmp/astrometry-temp";
	}
	return tempDir;
}

function resolveTempUploadDir(): string {
	let tempDir = configuration().queueFileUploadDir;
	if(!tempDir) {
		tempDir = "/tmp/astrometry-temp";
	}
	return tempDir;
}