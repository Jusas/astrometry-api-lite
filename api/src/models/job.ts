export enum ScaleUnits {
	degwidth = "degwidth",
	arcminwidth = "arcminwidth",
	arcsecperpix = "arcsecperpix",
}

export enum ScaleType {
	ul = "ul",
	ev = "ev"
}

export interface JobParams {
	scale_units?: ScaleUnits,
	scale_type?: ScaleType,
	scale_lower?: number,
	scale_upper?: number,
	scale_est?: number,
	/** 
	 * @minimum 0
	 * @maximum 100
	*/
	scale_err?: number,
	/** 
	 * @minimum 0
	 * @maximum 360
	*/
	center_ra?: number,
	/** 
	 * @minimum -90
	 * @maximum 90
	*/
	center_dec?: number,
	radius?: number,
	/** 
	 * @minimum 2
	*/
	downsample_factor?: number,	
	tweak_order?: number
	// Sex Tractor not supported for now. ;-)
	// use_sextractor: boolean,
	crpix_center?: boolean,
	/** 
	 * @isInt
	*/
	parity?: number,
	// Not supported currently.
	// image_width?: number,
	// Not supported currently.
	// image_height?: number,
	positional_error?: number
}

export interface JobQueueEntry extends JobCalibrationResultData {
	id: number,
	created: number,
	processing_state: number,
	processing_finished: number,
	processing_started: number,
	worker_id: string,
	filename: string,
	original_filename: string,
	error_id: string,
	error_text: string,
	p_scale_units: string,
	p_scale_type: string,
	p_scale_lower: number,
	p_scale_upper: number,
	p_scale_est: number,
	p_scale_err: number,
	p_center_ra: number,
	p_center_dec: number,
	p_radius: number,
	p_downsample_factor: number,
	p_tweak_order: number,
	p_crpix_center: number,
	p_parity: number,
	p_positional_error: number

}

export interface JobFileInfo {
	filename?: string,
	original_filename?: string,
	url?: string
}

export interface CreatedJobEntry {
	id: number,
	hash: string
}

export enum ProcessingState {
	Queued,
	Processing,
	Succeeded,
	Failed
}

export interface JobStatus {
	id: number,
	processing_started: number,
	processing_finished: number,
	processing_state: ProcessingState
}


export enum JobStatusResponseStatus {
	none = "none",
	success = "success",
	solving = "solving",
	failure = "failure"
}

export interface JobStatusResponse {
	status: JobStatusResponseStatus
}


export interface JobCalibrationResultData {
	result_parity: number,
	result_orientation: number,
	result_pixscale: number,
	result_radius: number,
	result_ra: number,
	result_dec: number
}

export interface JobCalibrationResponse {
	parity: number,
	orientation: number,
	pixscale: number,
	radius: number,
	ra: number,
	dec: number
}

export interface JobInfoResponse extends JobStatusResponse {
	calibration: JobCalibrationResponse,
	machine_tags: Array<string>,
	tags: Array<string>,
	original_filename: string,
	objects_in_field: Array<string>
}


//{"processing_started": "2018-02-24 14:39:44.555160", "job_calibrations": [[2443894, 1525689]], "jobs": [2443894], "processing_finished": "2018-02-24 14:39:44.616807", "user": 2633, "user_images": [1994214]}