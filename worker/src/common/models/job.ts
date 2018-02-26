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

export interface JobCalibrationResultData {
	result_parity: number,
	result_orientation: number,
	result_pixscale: number,
	result_radius: number,
	result_ra: number,
	result_dec: number
}
