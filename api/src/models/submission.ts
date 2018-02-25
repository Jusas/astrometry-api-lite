
export interface SubmissionInfoResponse {
	processing_started: string,
	job_calibrations: Array<number>,
	jobs: Array<number>,
	processing_finished: string,
	user: number,
	user_images: Array<string>
}
