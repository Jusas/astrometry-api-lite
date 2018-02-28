import * as sqlite from "sqlite";
import { JobParams, JobFileInfo, JobQueueEntry, CreatedJobEntry, JobStatus, JobCalibrationResultData } from "../models/job";
import * as SystemSettings from "../settings";
import * as cfg from "../configuration";
var crypto = require("crypto");
var datetime = require("node-datetime");
const fs = require('fs');

export async function queue(fileInfo: JobFileInfo, parameters: JobParams): Promise<CreatedJobEntry> {

	const started = datetime.create().now();
	const finished = started;

	let p = parameters;

	let dbFile = cfg.parseAsPath(cfg.get("api").database);
	var db = await sqlite.open(dbFile);
	await db.run("PRAGMA journal_mode = WAL;");

	let insertStatement = `INSERT INTO JobQueue (created, processing_state, filename, original_filename, url`;
	let s = [];

	if(p.center_dec) s.push({k: "p_center_dec", v: p.center_dec});
	if(p.center_ra) s.push({k: "p_center_ra", v: p.center_ra});
	if(p.crpix_center) s.push({k: "p_crpix_center", v: p.crpix_center});
	if(p.downsample_factor) s.push({k: "p_downsample_factor", v: p.downsample_factor});
	if(p.parity) s.push({k: "p_parity", v: p.parity});
	if(p.positional_error) s.push({k: "p_positional_error", v: p.positional_error});
	if(p.radius) s.push({k: "p_radius", v: p.radius});
	if(p.scale_err) s.push({k: "p_scale_err", v: p.scale_err});
	if(p.scale_est) s.push({k: "p_scale_est", v: p.scale_est});
	if(p.scale_lower) s.push({k: "p_scale_lower", v: p.scale_lower});
	if(p.scale_type) s.push({k: "p_scale_type", v: p.scale_type});
	if(p.scale_units) s.push({k: "p_scale_units", v: p.scale_units});
	if(p.scale_upper) s.push({k: "p_scale_upper", v: p.scale_upper});
	if(p.tweak_order) s.push({k: "p_tweak_order", v: p.tweak_order});

	if(s.length > 0) {
		s.map((parm) => insertStatement += `,${parm.k}`);			
	}

	insertStatement += `) VALUES (?, ?, ?, ?, ?`;
	s.forEach(() => insertStatement += `,?`);

	let values = [datetime.create().now(), 0, fileInfo.filename || null, fileInfo.original_filename || null, fileInfo.url || null];
	s.map((parm) => values.push(parm.v));

	insertStatement += "); SELECT last_insert_rowid()";

	let res: CreatedJobEntry = {
		id: -1,
		hash: "abcd"
	};

	let stmt = await db.prepare(insertStatement);
	let insertRes = await stmt.run(values);
	res.id = insertRes.lastID;
	
	await stmt.finalize();
	await db.close();
	
	return res;
}

export async function getStatus(id: number): Promise<JobStatus> {

	let dbFile = cfg.parseAsPath(cfg.get("api").database);
	var db = await sqlite.open(dbFile);
	await db.run("PRAGMA journal_mode = WAL;");
	
	let query = "SELECT processing_started, processing_finished, processing_state FROM JobQueue WHERE id = ?";
	var stmt = await db.prepare(query);
	let res = await stmt.get(id);
	stmt.finalize();
	db.close();


	if(!res) {
		return null;
	}
	var result: JobStatus = {
		id: id,
		processing_started: res.processing_started || null,
		processing_finished: res.processing_finished || null,
		processing_state: res.processing_state
	}

	return result;
}

export async function getCalibrationData(id: number): Promise<JobCalibrationResultData> {
	
	let dbFile = cfg.parseAsPath(cfg.get("api").database);
	var db = await sqlite.open(dbFile);
	await db.run("PRAGMA journal_mode = WAL;");
	
	let query = `SELECT result_parity, result_orientation, result_pixscale, 
		result_radius, result_ra, result_dec FROM JobQueue WHERE id = ?`;

	var stmt = await db.prepare(query);
	let res = <JobCalibrationResultData> await stmt.get(id);
	stmt.finalize();
	db.close();

	if(!res)
		return null;
	return res;

}

export async function getFullData(id: number): Promise<JobQueueEntry> {
	
	let dbFile = cfg.parseAsPath(cfg.get("api").database);
	var db = await sqlite.open(dbFile);
	await db.run("PRAGMA journal_mode = WAL;");
	let query = `SELECT * FROM JobQueue WHERE id = ?`;
	var stmt = await db.prepare(query);
	let res = <JobQueueEntry> await stmt.get(id);
	stmt.finalize();
	db.close();

	if(!res)
		return null;
	return res;
	
}